"use client";

import { ChatPopup } from './ChatPopup';
import { ChatEmbbed } from './ChatEmbbed';

export default function ChatPage() {
    return (
        <div className="min-h-screen">
            <ChatEmbbed />
        </div>
    );
}