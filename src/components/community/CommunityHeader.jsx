// src/components/community/CommunityHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { motion } from "framer-motion";

const CommunityHeader = ({ community, membersCount }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="relative h-72 rounded-xl overflow-hidden mb-8 shadow-lg">
                <img className="w-full h-full object-cover" alt={community.name} src={community.image_url} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-between p-8">
                    <div>
                        <Link to="/comunidades" className="text-white/80 hover:text-white inline-flex items-center mb-2 text-sm">
                            <ArrowLeft className="mr-1.5 h-4 w-4" />
                            Ver todas
                        </Link>
                        <h1 className="text-5xl font-bold text-white tracking-tight">{community.name}</h1>
                    </div>
                    <p className="text-lg text-gray-200 flex items-center">
                        <Users className="mr-2 h-5 w-5" /> {membersCount} miembros
                    </p>
                </div>
            </div>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl">{community.description}</p>
        </motion.div>
    );
};

export default CommunityHeader;