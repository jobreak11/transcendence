import React from "react";
import Image from 'next/image'
import { ParagraphCard } from "./ParagraphCard";
import Link from 'next/link'

const code_snipped: string = `
'use client';
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

export function ThreeJsPlayground()
{
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return ;
    // for development
    container.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(
      window.innerWidth / 2,
      window.innerHeight/ 2
    );
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(
      1,
      1,
      1
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00
    });
    const cube = new THREE.Mesh( geometry, material );
    scene.add(cube);
    camera.position.z = 5;

    function animate( time ){
      cube.rotation.x = time / 2000;
      cube.rotation.y = time / 1000;
      renderer.render( scene, camera );
    }
    renderer.setAnimationLoop( animate )

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  })

  return (
    <div ref={containerRef}/>
  )
}`

export default function Page() {
  return (
    <main className="flex flex-col">
      <h1 className="m-5 text-4xl font-bold mx-auto"> Three JS </h1>
      <button className="bg-white/10 mx-auto p-4 rounded-2xl
      hover:border-2
      "><Link href="/learn_three_js/three-js-playground">Three.js Playground</Link></button>
      <ParagraphCard title="How To Learn Three JS in React??">
        <p>
        To learn Three JS in React, from what i found
        .. the <b>React Three Fibre</b> is a Three js Wrapped to work
        effortlessly with React. However it skips all the important parts
        about basic knowledges of 3d rendering so Learning from
        bare Three.js library is the way i would suggest if you want to know
        the library throughoutly and also the 3d fundamental knowledges
        that might bring some advantages when you go into another 3d libraries
        </p>
      </ParagraphCard>
      <br/>
      <ParagraphCard title="How to actually work with ThreeJs in this environment?">
        <p>
        See this as the starting point. I will try to explain that why it need to be
        this way but let's see
        </p>
        <br/>
        <br/>
        <p>
        This is an example of how the bare three js would be when working with
        react
        </p>
        <br/>
        <br/>
        <pre className="bg-white/12 text-green-400 p-4 rounded-2xl">
        {code_snipped}
        </pre>
        <br/>
        <br/>

        <p>
          First, the <code>useRef</code> and <code>useEffect</code> are 
          the main React thing that we should know so i will explain it first
          
        </p>



      </ParagraphCard>

      <br/>
      <br/>
      <br/>

    </main>
  )
}