
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

const FacialExpression = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [mood, setMood] = useState("Detecting...");
  const [loading, setLoading] = useState(true);

  // Load Face API Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        console.log("Models Loaded Successfully");
        setLoading(false);
      } catch (error) {
        console.error("Error Loading Models:", error);
      }
    };

    loadModels();
  }, []);

  // Face Detection
  useEffect(() => {
    let interval;

    if (!loading) {
      interval = setInterval(async () => {
        try {
          if (
            webcamRef.current &&
            webcamRef.current.video &&
            webcamRef.current.video.readyState === 4
          ) {
            const video = webcamRef.current.video;

            // Detect Face + Expressions
            const detections = await faceapi
              .detectSingleFace(
                video,
                new faceapi.TinyFaceDetectorOptions()
              )
              .withFaceLandmarks()
              .withFaceExpressions();

            console.log("Detections:", detections);

            const canvas = canvasRef.current;

            if (!canvas) return;

            const displaySize = {
              width: video.videoWidth,
              height: video.videoHeight,
            };

            faceapi.matchDimensions(canvas, displaySize);

            const ctx = canvas.getContext("2d");

            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );

            // If face detected
            if (detections) {
              const resizedDetections =
                faceapi.resizeResults(
                  detections,
                  displaySize
                );

              // Draw detection box
              faceapi.draw.drawDetections(
                canvas,
                resizedDetections
              );

              // Expressions object
              const expressions =
                detections.expressions;

              // Find highest probability expression
              let mostProbableExpression =
                "neutral";

              for (const expression in expressions) {
                if (
                  expressions[expression] >
                  expressions[
                    mostProbableExpression
                  ]
                ) {
                  mostProbableExpression =
                    expression;
                }
              }

              console.log(
                "Most Probable Expression:",
                mostProbableExpression
              );

              setMood(mostProbableExpression);
            } else {
              setMood("No Face Detected");
            }
          }
        } catch (error) {
          console.error(
            "Detection Error:",
            error
          );
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
      }}
    >
      <h1>Moody Player</h1>

      <div
        style={{
          position: "relative",
          width: "640px",
          margin: "0 auto",
        }}
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user",
          }}
          style={{
            width: "640px",
            height: "480px",
            borderRadius: "10px",
          }}
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>

      <h2
        style={{
          marginTop: "20px",
          color: "#333",
        }}
      >
        Mood: {mood}
      </h2>
    </div>
  );
};

export default FacialExpression;
