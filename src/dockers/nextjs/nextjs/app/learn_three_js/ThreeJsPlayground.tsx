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
}