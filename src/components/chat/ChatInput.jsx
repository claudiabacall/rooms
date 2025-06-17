import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Smile } from "lucide-react";
import EmojiPicker from 'emoji-picker-react'; // Asumiendo que lo importas aquí

const ChatInput = ({
    newMessage,
    setNewMessage,
    handleSendMessage,
    showEmojiPicker,
    toggleEmojiPicker,
    onEmojiClick,
    inputRef
}) => {
    return (
        <footer className="p-4 border-t bg-muted/20 relative">
            {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-20">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <Button variant="ghost" size="icon" type="button" onClick={toggleEmojiPicker}>
                    <Smile className="h-5 w-5" />
                </Button>
                <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                />
                <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </footer>
    );
};

export default ChatInput;