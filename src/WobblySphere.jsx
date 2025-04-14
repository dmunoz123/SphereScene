import { meshBounds, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";
import CustomShaderMaterial from "three-custom-shader-material";
import CustomShaderMaterial1 from "three-custom-shader-material/vanilla";
import { useMemo, useEffect, useRef, useState } from "react";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

export default function WobblySphere() {
  const meshRef = useRef();
  const { mouse } = useThree();
  // State to determine whether sniffing is active (sphere is dynamic)
  const [isActive, setIsActive] = useState(false);

  // Leva controls (Customize Material)
  const {
    metalness,
    roughness,
    transmission,
    thickness,
    clearcoat,
    ccRoughness,
    ior,
    irid,
    iridIOR,
    reflectivity,
    sheen,
    sheenRoughness,
    sheenColor,
    color,
    uMouseStrength,
    uMouseRadius,
  } = useControls("Customize Material", {
    envMapOn: { value: true },
    metalness: { value: 0, min: -1.0, max: 1.0, step: 0.001 },
    roughness: { value: 0.5, min: -1.0, max: 1.0, step: 0.001 },
    transmission: { value: 0.01, min: -1.0, max: 1.0, step: 0.001 },
    thickness: { value: 1.5, min: 0.0, max: 10.0, step: 0.001 },
    clearcoat: { value: 1.0, min: 0.0, max: 1.0, step: 0.001 },
    ccRoughness: { value: 0.01, min: 0.0, max: 1.0, step: 0.001 },
    ior: { value: 1.5, min: 0.0, max: 10.0, step: 0.001 },
    irid: { value: 0.0, min: 0.0, max: 1.0, step: 0.001 },
    iridIOR: { value: 1.3, min: 1.0, max: 2.333, step: 0.001 },
    reflectivity: { value: 0.5, min: 0.0, max: 1.5, step: 0.001 },
    sheen: { value: 0.5, min: 0.0, max: 1.0, step: 0.001 },
    sheenRoughness: { value: 0.5, min: 0.0, max: 1.0, step: 0.001 },
    sheenColor: "#000000",
    color: "#ffffff",
    uMouseStrength: { value: 3.0, min: 0.0, max: 50.0, step: 0.001 },
    uMouseRadius: { value: 2.0, min: 0.0, max: 10.0, step: 0.001 },
  });

  // Leva controls (Material Movement)
  const {
    uTimeFreq,
    uWPosFreq,
    uWTimeFreq,
    uWStrength,
    uColorA,
    uColorB,
    uShift,
  } = useControls("Material Movement", {
    uTimeFreq: { value: 0.15, min: 0, max: 2, step: 0.001 },
    uWPosFreq: { value: 0.38, min: 0, max: 2, step: 0.001 },
    uWTimeFreq: { value: 0.12, min: 0, max: 2, step: 0.001 },
    uWStrength: { value: 1.0, min: 0, max: 1.3, step: 0.001 },
    uColorA: "#f108f7",
    uColorB: "#4c00ff",
    uShift: { value: 0.18, min: 0.0001, max: 2.0, step: 0.001 },
  });

  // Define shader uniforms
  const uniforms = useMemo(
    () => ({
      uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
      uMouseStrength: new THREE.Uniform(3.0),
      uMouseRadius: new THREE.Uniform(2.0),
      uTime: new THREE.Uniform(0),
      uPositionFrequency: new THREE.Uniform(0.5),
      uTimeFrequency: new THREE.Uniform(0.15),
      uStrength: new THREE.Uniform(0.3),
      uWarpPositionFrequency: new THREE.Uniform(0.38),
      uWarpTimeFrequency: new THREE.Uniform(0.12),
      uWarpStrength: new THREE.Uniform(1.7),
      uColorA: new THREE.Uniform(new THREE.Color("#f108f7")),
      uColorB: new THREE.Uniform(new THREE.Color("#4c00ff")),
      uShift: new THREE.Uniform(0.18),
    }),
    []
  );

  // Update uniforms when Leva controls change
  useEffect(() => {
    uniforms.uTimeFrequency.value = uTimeFreq;
    uniforms.uWarpPositionFrequency.value = uWPosFreq;
    uniforms.uWarpTimeFrequency.value = uWTimeFreq;
    uniforms.uWarpStrength.value = uWStrength;
    uniforms.uColorA.value.set(uColorA);
    uniforms.uColorB.value.set(uColorB);
    uniforms.uShift.value = uShift;
    uniforms.uMouseStrength.value = uMouseStrength;
    uniforms.uMouseRadius.value = uMouseRadius;
  }, [
    uTimeFreq,
    uWPosFreq,
    uWTimeFreq,
    uWStrength,
    uColorA,
    uColorB,
    uShift,
    uMouseStrength,
    uMouseRadius,
    uniforms,
  ]);

  // Create an icosahedron geometry and optimize it
  const icoGeometry = useMemo(() => {
    let geo = new THREE.IcosahedronGeometry(2.0, 55);
    geo = mergeVertices(geo);
    geo.computeTangents();
    return geo;
  }, []);

  // Create a depth material for shadows and custom shader effects
  const depthMaterial = useMemo(
    () =>
      new CustomShaderMaterial1({
        baseMaterial: THREE.MeshDepthMaterial,
        vertexShader: wobbleVertexShader,
        uniforms: uniforms,
        depthPacking: THREE.RGBADepthPacking,
      }),
    [uniforms]
  );

  // Set up a clock for time-based animations
  const clock = useMemo(() => new THREE.Clock(), []);
  const previousTimeRef = useRef(0);

  useFrame(() => {
    const elapsedTime = clock.getElapsedTime();
    uniforms.uTime.value = elapsedTime;

    if (isActive) {
      // Update mouse-based uniforms
      uniforms.uMouse.value.set(mouse.x - 0.5, mouse.y - 0.5);

      // Calculate dynamic frequency and strength based on mouse
      const mouseMag = Math.sqrt((mouse.x - 0.35) ** 2 + (mouse.y - 0.35) ** 2);
      const normalizedMouse = mouseMag / Math.sqrt(2);
      const minPosFrequency = 0.15;
      const maxPosFrequency = 0.75;
      const minStrengthFrequency = 0.15;
      const maxStrengthFrequency = 0.75;

      uniforms.uPositionFrequency.value =
        minPosFrequency +
        (maxPosFrequency - minPosFrequency) * Math.sin(normalizedMouse);
      uniforms.uStrength.value =
        minStrengthFrequency +
        (maxStrengthFrequency - minStrengthFrequency) *
          Math.sin(normalizedMouse);
    } else {
      // Disable mouse tracking: reset uMouse and set static default values
      uniforms.uMouse.value.set(0, 0);

      // Set static (default) values when inactive
      uniforms.uPositionFrequency.value = 0.5; // or any default value
      uniforms.uStrength.value = 0.3; // or any default value
    }
  });

  // Function to update colors randomly (using HSL) for the active state
  const eventHandler = () => {
    const hueA = Math.random();
    const hueB = Math.random();
    uniforms.uColorA.value.setHSL(hueA, 1.0, Math.random());
    uniforms.uColorB.value.setHSL(hueB, 1.0, Math.random());
  };

  // Function to toggle the active state and call appropriate API endpoints
  const toggleActive = async () => {
    if (!isActive) {
      // Start sniffing and activate visual mode
      try {
        await fetch(
          "http://daniel-aws-s3-mks-myawstestbucket.s3-website-us-west-1.amazonaws.com/api/start-sniffing"
        );

        setIsActive(true);
      } catch (err) {
        console.error("Error starting sniffing:", err);
      }
    } else {
      // Stop sniffing and return to static (off) mode
      try {
        await fetch(
          "http://daniel-aws-s3-mks-myawstestbucket.s3-website-us-west-1.amazonaws.com/api/stop-sniffing"
        );
        setIsActive(false);
      } catch (err) {
        console.error("Error stopping sniffing:", err);
      }
    }
  };

  // Set up an interval to change colors randomly every second when active
  useEffect(() => {
    let intervalId;
    if (isActive) {
      // Change color immediately and then every second
      eventHandler();
      intervalId = setInterval(eventHandler, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive]);

  return (
    <group>
      <mesh
        ref={meshRef}
        raycast={meshBounds}
        receiveShadow
        castShadow
        geometry={icoGeometry}
        customDepthMaterial={depthMaterial}
        onPointerEnter={() => (document.body.style.cursor = "pointer")}
        onPointerLeave={() => (document.body.style.cursor = "default")}
        onClick={toggleActive} // Toggle active mode and API calls on click
      >
        <CustomShaderMaterial
          baseMaterial={THREE.MeshPhysicalMaterial}
          vertexShader={wobbleVertexShader}
          fragmentShader={wobbleFragmentShader}
          uniforms={uniforms}
          metalness={metalness}
          roughness={roughness}
          color={color}
          transmission={transmission}
          clearcoat={clearcoat}
          clearcoatRoughness={ccRoughness}
          ior={ior}
          reflectivity={reflectivity}
          sheen={sheen}
          sheenRoughness={sheenRoughness}
          sheenColor={sheenColor}
          iridescence={irid}
          iridescenceIOR={iridIOR}
          thickness={thickness}
          transparent={true}
          wireframe={false}
        />
      </mesh>

      {/* Text above the sphere */}
      <Text
        position={[0, 3, 0]} // Adjust as needed to place the text above the sphere
        rotation={[0, 0.65, 0]}
        fontSize={0.4} // Adjust font size as needed
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        Click Sphere To Begin Network Packet Sniffing!
      </Text>
    </group>
  );
}
