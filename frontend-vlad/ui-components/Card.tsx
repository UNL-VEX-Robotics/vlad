"use client";

import React from 'react';

const CardHeader = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex w-full h-1/6 bg-[var(--card-header-bg)] items-center justify-center text-[var(--card-text)] text-center border-b-2 border-[var(--card-border)] rounded-t-lg font-semibold">
            {children}
        </div>
    );
};

const CardBody = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col gap-6 w-full h-full bg-[var(--card-bg)] items-center justify-center text-[var(--card-text)] text-center rounded-b-lg">
            {children}
        </div>
    );
};

interface CardProps {
    title: React.ReactNode;
    children: React.ReactNode;
    styles?: string;
}

export const Card = ({
    title,
    children,
    styles = '',
}: CardProps) => {
    return (
        <div className={`flex flex-col w-96 h-96 bg-[var(--card-bg)] items-center text-[var(--card-text)] text-center border-2 border-[var(--card-border)] rounded-lg ${styles}`}>
            <CardHeader>{title}</CardHeader>
            <CardBody>{children}</CardBody>
        </div>
    );
};