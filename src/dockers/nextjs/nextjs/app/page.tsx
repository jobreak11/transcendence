import Link from 'next/link'

export default function Page() {

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className=' flex justify-center
      m-3 mx-auto w-fit'>
        <h1 className='text-center m-4 font-bold text-5xl'>Welcome</h1>
      </div>
      <div className=' mx-auto m-4 p-10'>
      <p>This webstie is still in development stage, so it will have a lot
        of bugs and mistakes. But There will be knowledges along the way.
      </p>
        <br/>
        <p>
          Currently i'm learning on how to work with Three.js. You can give
          a visit here
        </p>
      </div>
      <Link href='/Duel_Board' className='bg-slate-600 p-4 rounded-2xl hover:border-2'>Duel Board</Link>
      <br/>
      <Link href='/tic-tac-toe' className='bg-slate-600 p-4 rounded-2x1 hover:border-2'>Tic-Tac-Toe</Link>
    </div>
  )
}