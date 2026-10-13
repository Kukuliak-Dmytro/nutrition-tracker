"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Button } from "./button"
import { AlertCircle } from "lucide-react"

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
    error: Error
    resetError: () => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Error caught by boundary:", error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const Fallback = this.props.fallback || DefaultErrorFallback
            return <Fallback error={this.state.error} resetError={this.resetError} />
        }

        return this.props.children
    }
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
    const tCommon = useTranslations("common")
    const tErrors = useTranslations("errors")

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <AlertCircle className="w-16 h-16 text-destructive" />
                <div>
                    <h2 className="text-2xl font-semibold mb-2">{tErrors("somethingWentWrong")}</h2>
                    <p className="text-muted-foreground mb-4">
                        {error.message || tErrors("unexpectedError")}
                    </p>
                </div>
                <Button onClick={resetError} variant="default">
                    {tCommon("retry")}
                </Button>
            </div>
        </div>
    )
}

export { ErrorBoundary }
export type { ErrorFallbackProps }

