import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Bvh,
  Environment,
} from "@react-three/drei";
import { useControls } from "leva";
import "./Index.css";
import WobblySphere from "./WobblySphere.jsx";

function ResponsiveCamera() {
  const { camera, size } = useThree();
  // Update camera on every size change
  useEffect(() => {
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function App() {
  // Create Leva controls for the directional light settings.
  const { lightColor, lightIntensity } = useControls("Directional Light", {
    lightColor: { value: "#ffffff" },
    lightIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
  });

  return (
    <div className="canvas-container">
      <Canvas shadows>
        <Environment preset="night" background />
        <Bvh>
          <ResponsiveCamera />
          <PerspectiveCamera
            makeDefault
            fov={45}
            near={0.1}
            far={100}
            position={[5, 2, 9]}
          />
          <directionalLight
            // Pass the Leva-controlled values into the light's args.
            args={[lightColor, lightIntensity]}
            position={[0.0, 3.0, 5.0]}
            castShadow
          />
          <OrbitControls enableDamping />
          <WobblySphere />
        </Bvh>
      </Canvas>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
