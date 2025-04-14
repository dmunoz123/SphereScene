import { StrictMode, useEffect, useState } from "react";
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
  const [predictions, setPredictions] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  // Create Leva controls for the directional light settings.
  const { lightColor, lightIntensity } = useControls("Directional Light", {
    lightColor: { value: "#ffffff" },
    lightIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
  });

  const runModel = async () => {
    const res = await fetch("/api/run-predictions");
    const data = await res.json();
    if (data.predictions) {
      setPredictions(data.predictions);
      setModelInfo(data.model_info);
    } else {
      console.error(data.error);
    }
  };

  return (
    // Wrap the Canvas in a div with "position: relative"
    <div className="canvas-container" style={{ position: "relative" }}>
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

      {/* Floating overlay for predictions */}
      <div
        className="prediction-overlay"
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          maxHeight: "40%",
          width: "50%",
          overflowY: "auto",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          textAlign: "center", // centers all content inside
        }}
      >
        <button
          onClick={runModel}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#007bff", // Blue background
            color: "#fff",
            border: "none",
            borderRadius: "8px", // Rounded corners
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          Run AutoGluon Prediction
        </button>

        {predictions.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>AutoGluon Model Prediction Summary</h3>
            <p>
              Below are the top 10 predictions from the model for the most
              recent network packets.
              <br />
              <strong>0</strong> = safe, <strong>1</strong> = dangerous.
            </p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {predictions.map((pred, idx) => (
                <li key={idx} style={{ fontSize: "14px" }}>
                  Prediction {idx + 1}: <strong>{pred}</strong>
                </li>
              ))}
            </ul>

            {modelInfo && (
              <div style={{ marginTop: 20 }}>
                <h4>Model Info</h4>
                <p>
                  <strong>Path:</strong> {modelInfo.model_path}
                </p>
                <p>
                  <strong>Eval Metric:</strong> {modelInfo.eval_metric}
                </p>
                <h4>Leaderboard Snapshot</h4>
                <table style={{ margin: "0 auto", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {Object.keys(modelInfo.leaderboard[0]).map((key) => (
                        <th key={key} style={{ padding: "4px 8px" }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelInfo.leaderboard.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i} style={{ padding: "4px 8px" }}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
