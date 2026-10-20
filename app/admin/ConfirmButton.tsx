"use client";

type Props = {
    children: React.ReactNode;
    message: string;
    formAction: (form: FormData) => Promise<void>;
    className?: string;
};

export default function ConfirmButton({ children, message, formAction, className }: Props) {
    return (
        <button formAction={formAction} className={className} onClick={event => { if (!confirm(message)) event.preventDefault(); }}>
            {children}
        </button>
    );
}
