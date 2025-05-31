import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader.js';

const MoleculeScene = () => {
  const containerRef = useRef();

  useEffect(() => {
    let camera, scene, renderer, controls, root;
    const objects = [];
    const offset = new THREE.Vector3();
    const loader = new PDBLoader();
    const baseSprite = document.createElement('img');
    const colorSpriteMap = {};
    const tmpVec1 = new THREE.Vector3();
    const tmpVec2 = new THREE.Vector3();
    const tmpVec3 = new THREE.Vector3();
    const tmpVec4 = new THREE.Vector3();

    const init = () => {
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);
      camera.position.z = 1000; 

      scene = new THREE.Scene();

      root = new THREE.Object3D();
      scene.add(root);

      renderer = new CSS3DRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.appendChild(renderer.domElement);

      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = 0;
      renderer.domElement.style.zIndex = '-1'; 
      renderer.domElement.style.background =
        'radial-gradient(ellipse at center, rgba(43,45,48,1) 0%, rgba(0,0,0,1) 100%)';

      controls = new TrackballControls(camera, renderer.domElement);
      controls.rotateSpeed = 0.5;

      baseSprite.onload = () => {
        loadMolecule('caffeine.pdb');
      };
      baseSprite.src = '/textures/sprites/ball.png';

      window.addEventListener('resize', onWindowResize);
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const colorify = (ctx, width, height, color) => {
      const { r, g, b } = color;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        data[i] *= r;
        data[i + 1] *= g;
        data[i + 2] *= b;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const imageToCanvas = (image) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      return canvas;
    };

    const loadMolecule = (model) => {
      const url = `/models/pdb/${model}`;
      objects.forEach((obj) => obj.parent?.remove(obj));
      objects.length = 0;

      loader.load(url, (pdb) => {
        const { geometryAtoms, geometryBonds, json } = pdb;

        geometryAtoms.computeBoundingBox();
        geometryAtoms.boundingBox.getCenter(offset).negate();
        geometryAtoms.translate(offset.x, offset.y, offset.z);
        geometryBonds.translate(offset.x, offset.y, offset.z);

        const positionAtoms = geometryAtoms.getAttribute('position');
        const colorAtoms = geometryAtoms.getAttribute('color');

        const position = new THREE.Vector3();
        const color = new THREE.Color();

        for (let i = 0; i < positionAtoms.count; i++) {
          position.fromBufferAttribute(positionAtoms, i);
          color.fromBufferAttribute(colorAtoms, i);
          const element = json.atoms[i][4];

          if (!colorSpriteMap[element]) {
            const canvas = imageToCanvas(baseSprite);
            const ctx = canvas.getContext('2d');
            colorify(ctx, canvas.width, canvas.height, color);
            colorSpriteMap[element] = canvas.toDataURL();
          }

          const atomImg = document.createElement('img');
          atomImg.src = colorSpriteMap[element];
          atomImg.className = 'w-8 h-8';

          const atomObject = new CSS3DSprite(atomImg);
          atomObject.position.copy(position).multiplyScalar(150);
          atomObject.matrixAutoUpdate = false;
          atomObject.updateMatrix();

          root.add(atomObject);
          objects.push(atomObject);
        }

        const positionBonds = geometryBonds.getAttribute('position');
        const start = new THREE.Vector3();
        const end = new THREE.Vector3();

        for (let i = 0; i < positionBonds.count; i += 2) {
          start.fromBufferAttribute(positionBonds, i).multiplyScalar(150);
          end.fromBufferAttribute(positionBonds, i + 1).multiplyScalar(150);

          tmpVec1.subVectors(end, start);
          const bondLength = tmpVec1.length() - 50;

          let bond = document.createElement('div');
          bond.className = 'bg-gray-200 w-[5px]';
          bond.style.height = `${bondLength}px`;

          let bondObject = new CSS3DObject(bond);
          bondObject.position.copy(start).lerp(end, 0.5);

          bondObject.userData.bondLengthShort = `${bondLength}px`;
          bondObject.userData.bondLengthFull = `${bondLength + 55}px`;

          const axis = tmpVec2.set(0, 1, 0).cross(tmpVec1);
          const radians = Math.acos(tmpVec3.set(0, 1, 0).dot(tmpVec4.copy(tmpVec1).normalize()));
          const matrix = new THREE.Matrix4().makeRotationAxis(axis.normalize(), radians);
          bondObject.matrix.copy(matrix);
          bondObject.quaternion.setFromRotationMatrix(matrix);
          bondObject.matrixAutoUpdate = false;
          bondObject.updateMatrix();

          root.add(bondObject);
          objects.push(bondObject);
        }
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      const time = Date.now() * 0.0004;
      root.rotation.x = time;
      root.rotation.y = time * 0.7;

      renderer.render(scene, camera);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      controls.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-screen" />;
};

export default MoleculeScene;