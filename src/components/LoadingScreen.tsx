import React from 'react';
import { motion } from 'motion/react';
import { Package } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 bg-olive-600 rounded-2xl shadow-xl shadow-olive-100/50">
            <Package size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900">
            DARBE <span className="text-olive-600">LOGISTICS</span>
          </h1>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-olive-500 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-10 right-10 flex flex-col items-end gap-2"
      >
        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em] mr-1">powered by</span>
        <div className="flex items-center gap-1">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Blue slanted bar - Parallel to the triangle leg with distinct gap */}
              <path d="M35 15 L45 15 L15 90 H5 L35 15 Z" fill="#7e8eb2" />
              
              {/* Main Orange Triangle - Broadened and Symmetrical */}
              <path d="M50 15 L20 90 H80 L50 15 Z" fill="#f28c38" />
              
              {/* White Arrow Cutout inside the orange triangle */}
              {/* Arrow head */}
              <path d="M50 45 L34 72 H66 L50 45 Z" fill="white" />
              {/* Arrow stem */}
              <path d="M43 72 H57 V90 H43 V72 Z" fill="white" />
            </svg>
          </div>
          <span className="font-serif text-3xl font-extrabold tracking-tighter flex items-baseline leading-none -ml-1">
            <span style={{ color: '#7e8eb2' }}>Sapp</span>
            <span style={{ color: '#f28c38' }}>hire</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
