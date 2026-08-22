'use client';
import { motion } from 'motion/react'

export function ParagraphCard({title, children}: {
  title: string,
  children?: React.ReactNode,
}): React.ReactElement {

  return (
    <motion.div className="m-5" id={`paragraph card ${title}`}

    initial={{
      opacity: 0,
      y: '10rem'
    }}
    animate={{
      opacity: 1,
      y: 0
    }}
    transition={{
      duration: 1.4,
      ease: 'easeInOut'
    }}
    
    >
    <h1 className="text-3xl font-bold">{title}</h1>
    <br/>
    <div className="ml-6">
      {children}
    </div>
    </motion.div>
  )
}