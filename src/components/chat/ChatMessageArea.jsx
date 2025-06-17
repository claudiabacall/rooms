import React from 'react';
import { motion } from "framer-motion";

const ChatMessageArea = ({ messages, messagesEndRef }) => {
    return (
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-primary-light">
            {messages.map((msg, index) => (
                <motion.div
                    key={index}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className={`max-w-[75%] md:max-w-xs lg:max-w-md p-3 rounded-xl shadow ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                </motion.div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessageArea;