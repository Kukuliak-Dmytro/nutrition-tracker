import json
import subprocess
import time
import urllib.request

MODELS = ["qwen2.5:1.5b", "qwen2.5:3b", "llama3.2:3b"]
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

SYSTEM_PROMPT = "Ти помічник щоденника харчування. Виділи продукти та їх вагу (в грамах) у форматі JSON з полями: meal_type, items: [{name, weight_grams}]. Відповідай виключно валідним JSON без додаткового тексту."
USER_PROMPT = "З'їв на обід 200г вареної гречки, 150г запеченого курячого філе та середнє яблуко."

def get_docker_ram():
    try:
        res = subprocess.check_output(
            ["docker", "stats", "nutrition_tracker_ollama", "--no-stream", "--format", "{{.MemUsage}}"],
            text=True
        ).strip()
        return res
    except Exception:
        return "N/A"

def run_test(model_name):
    print(f"\n==========================================")
    print(f"Тестування моделі: {model_name}")
    print(f"==========================================")
    
    payload = {
        "model": model_name,
        "system": SYSTEM_PROMPT,
        "prompt": USER_PROMPT,
        "stream": False,
        "options": {
            "temperature": 0.2
        }
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(OLLAMA_URL, data=data, headers={"Content-Type": "application/json"})
    
    # 1. First run (Cold / Load)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            res1 = json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Помилка при запиті: {e}")
        return None
    total_wall1 = time.time() - t0
    
    # 2. Second run (Warm)
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=120) as response:
        res2 = json.loads(response.read().decode("utf-8"))
    total_wall2 = time.time() - t0
    
    ram_usage = get_docker_ram()
    
    load_sec = res1.get("load_duration", 0) / 1e9
    prompt_tokens = res2.get("prompt_eval_count", 0)
    prompt_eval_sec = res2.get("prompt_eval_duration", 0) / 1e9
    prompt_speed = (prompt_tokens / prompt_eval_sec) if prompt_eval_sec > 0 else 0
    
    gen_tokens = res2.get("eval_count", 0)
    gen_sec = res2.get("eval_duration", 0) / 1e9
    gen_speed = (gen_tokens / gen_sec) if gen_sec > 0 else 0
    
    ttft_warm = prompt_eval_sec  # Once warm, TTFT is prompt eval time
    
    print(f"Cold Start (Load Model):    {load_sec:.2f} s (Total Wall: {total_wall1:.2f} s)")
    print(f"Warm TTFT:                  {ttft_warm:.2f} s")
    print(f"Prompt Processing Speed:    {prompt_speed:.1f} tok/s ({prompt_tokens} tokens)")
    print(f"Generation Speed:           {gen_speed:.1f} tok/s ({gen_tokens} tokens in {gen_sec:.2f} s)")
    print(f"RAM Usage in Docker:        {ram_usage}")
    print(f"Warm Wall Time:             {total_wall2:.2f} s")
    print(f"\nЗгенерована відповідь:")
    print(f"------------------------------------------")
    print(res2.get("response", "").strip())
    print(f"------------------------------------------")
    
    return {
        "model": model_name,
        "load_sec": load_sec,
        "warm_ttft": ttft_warm,
        "gen_speed": gen_speed,
        "prompt_speed": prompt_speed,
        "ram": ram_usage,
        "wall_sec": total_wall2,
        "response": res2.get("response", "").strip()
    }

if __name__ == "__main__":
    results = []
    for m in MODELS:
        res = run_test(m)
        if res:
            results.append(res)
    
    print("\n\n" + "="*80)
    print("ПІДСУМКОВА ТАБЛИЦЯ БЕНЧМАРКУ (i5-7500T 4C/4T @ 2.7GHz)")
    print("="*80)
    print(f"{'Модель':<16} | {'Cold Load':<10} | {'Warm TTFT':<10} | {'Gen (tok/s)':<12} | {'RAM Usage':<18} | {'Warm Total'}")
    print("-" * 80)
    for r in results:
        print(f"{r['model']:<16} | {r['load_sec']:>8.2f} s | {r['warm_ttft']:>8.2f} s | {r['gen_speed']:>10.1f} | {r['ram']:<18} | {r['wall_sec']:>8.2f} s")
    print("="*80)
