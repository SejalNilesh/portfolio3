import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Dog = () => {
  /* =========================
     LOAD MODEL
  ========================= */
  const model = useGLTF("/models/dog.drc.glb");

  useThree(({ camera, gl }) => {
    camera.position.z = 0.55;
    gl.toneMapping = THREE.ReinhardToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  });

  const { actions } = useAnimations(model.animations, model.scene);

  useEffect(() => {
    actions?.["Take 001"]?.play();
  }, [actions]);

  /* =========================
     TEXTURES
  ========================= */
  const [normalMap] = useTexture(["/dog_normals.jpg"]);
  normalMap.flipY = false;
  normalMap.colorSpace = THREE.SRGBColorSpace;

  const [branchMap, branchNormalMap] = useTexture([
    "/branches_diffuse.jpeg",
    "/branches_normals.jpeg",
  ]);

  branchMap.colorSpace = THREE.SRGBColorSpace;
  branchNormalMap.colorSpace = THREE.SRGBColorSpace;

  const matcaps = useTexture([
    "/matcap/mat-1.png",
    "/matcap/mat-2.png",
    "/matcap/mat-3.png",
    "/matcap/mat-4.png",
    "/matcap/mat-5.png",
    "/matcap/mat-6.png",
    "/matcap/mat-7.png",
    "/matcap/mat-8.png",  // BLUE (we’ll use this as default)
    "/matcap/mat-9.png",
    "/matcap/mat-10.png",
    "/matcap/mat-11.png",
    "/matcap/mat-12.png",
    "/matcap/mat-13.png",
    "/matcap/mat-14.png",
    "/matcap/mat-15.png",
    "/matcap/mat-16.png",
    "/matcap/mat-17.png",
    "/matcap/mat-18.png",
    "/matcap/mat-19.png",
    "/matcap/mat-20.png",
  ]);

  matcaps.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));

  const [
    mat1, mat2, mat3, mat4, mat5,
    mat6, mat7, mat8, mat9, mat10,
    mat11, mat12, mat13, mat14, mat15,
    mat16, mat17, mat18, mat19, mat20
  ] = matcaps;

  /* =========================
     SHADER UNIFORMS (DEFAULT = BLUE)
  ========================= */
  const DEFAULT_MAT = mat8;

  const material = useRef({
    uMatcap1: { value: DEFAULT_MAT },
    uMatcap2: { value: DEFAULT_MAT },
    uProgress: { value: 1 },
  });

  /* =========================
     MATERIALS
  ========================= */
  const dogMaterial = new THREE.MeshMatcapMaterial({
    matcap: DEFAULT_MAT,
    normalMap,
  });

  const branchMaterial = new THREE.MeshMatcapMaterial({
    map: branchMap,
    normalMap: branchNormalMap,
  });

  dogMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uMatcapTexture1 = material.current.uMatcap1;
    shader.uniforms.uMatcapTexture2 = material.current.uMatcap2;
    shader.uniforms.uProgress = material.current.uProgress;

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `
      uniform sampler2D uMatcapTexture1;
      uniform sampler2D uMatcapTexture2;
      uniform float uProgress;
      void main() {
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "vec4 matcapColor = texture2D( matcap, uv );",
      `
      vec4 c1 = texture2D(uMatcapTexture1, uv);
      vec4 c2 = texture2D(uMatcapTexture2, uv);
      vec4 matcapColor = mix(c1, c2, uProgress);
      `
    );
  };

  /* =========================
     APPLY MATERIALS
  ========================= */
  model.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = child.name.includes("DOG")
        ? dogMaterial
        : branchMaterial;
    }
  });

  const dogModel = useRef(model);

  /* =========================
     SCROLL ANIMATION
  ========================= */
  useGSAP(() => {
    gsap.timeline({
      scrollTrigger: {
        trigger: "#section-1",
        endTrigger: "#section-3",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    })
      .to(dogModel.current.scene.position, {
        z: "-=0.75",
        y: "+=0.1",
      })
      .to(dogModel.current.scene.rotation, {
        x: `+=${Math.PI / 15}`,
      })
      .to(
        dogModel.current.scene.rotation,
        { y: `-=${Math.PI}` },
        "third"
      )
      .to(
        dogModel.current.scene.position,
        { x: "-=0.5", z: "+=0.6", y: "-=0.05" },
        "third"
      );
  }, []);

  /* =========================
     HOVER COLOR CHANGE (FIXED)
  ========================= */
  useEffect(() => {
    const titles = document.querySelectorAll(".title");
    if (!titles.length) return;

    const matMap = {
      tomorrowland: mat19,
      "navy-pier": mat8,
      "msi-chicago": mat9,
      phone: mat12,
      kikk: mat10,
      kennedy: mat8,
      opera: mat13,
    };

    const changeMatcap = (nextMat) => {
      material.current.uMatcap1.value =
        material.current.uMatcap2.value;
      material.current.uMatcap2.value = nextMat;

      gsap.fromTo(
        material.current.uProgress,
        { value: 0 },
        { value: 1, duration: 0.35, ease: "power2.out" }
      );
    };

    const handlers = [];

    titles.forEach((el) => {
      const id = el.getAttribute("img-title");
      const mat = matMap[id];
      if (!mat) return;

      const handler = () => changeMatcap(mat);
      el.addEventListener("mouseenter", handler);
      handlers.push({ el, handler });
    });

    return () => {
      handlers.forEach(({ el, handler }) =>
        el.removeEventListener("mouseenter", handler)
      );
    };
  }, []);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <primitive
        object={model.scene}
        position={[0.25, -0.55, 0]}
        rotation={[0, Math.PI / 3.9, 0]}
      />
      <directionalLight position={[0, 5, 5]} intensity={10} />
    </>
  );
};

export default Dog;
