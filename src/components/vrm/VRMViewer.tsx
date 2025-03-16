'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMUtils, VRMSchema } from '@pixiv/three-vrm';

interface VRMViewerProps {
  modelPath: string;
  parameters?: {
    parameterType: string;
    parameterName: string;
    value: number;
  }[];
}

const VRMModel: React.FC<{ 
  modelPath: string;
  parameters?: {
    parameterType: string;
    parameterName: string;
    value: number;
  }[];
}> = ({ modelPath, parameters }) => {
  const { scene } = useThree();
  const modelRef = useRef<THREE.Group | null>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // VRMローダーの設定
    const loader = new GLTFLoader();
    
    // VRMプラグインを追加
    loader.register((parser) => {
      return new VRM.VRMLoaderPlugin(parser);
    });

    setLoading(true);
    setError(null);

    // VRMモデルのロード
    loader.load(
      modelPath,
      (gltf) => {
        // VRMインスタンスを取得
        const vrm = gltf.userData.vrm;
        
        // VRMモデルの初期設定
        VRMUtils.removeUnnecessaryJoints(gltf.scene);
        
        // モデルのスケール調整
        vrm.scene.scale.set(1.0, 1.0, 1.0);
        
        // モデルの回転調整（Y軸で180度回転させて正面を向かせる）
        vrm.scene.rotation.y = Math.PI;
        
        // シーンに追加
        scene.add(vrm.scene);
        
        // 参照を保存
        modelRef.current = vrm.scene;
        setVrm(vrm);
        setLoading(false);
      },
      (progress) => {
        // 読み込み進捗の処理（必要に応じて）
        console.log('Loading model...', progress.loaded / progress.total * 100, '%');
      },
      (error) => {
        console.error('VRMモデルの読み込みに失敗しました:', error);
        setError('モデルの読み込みに失敗しました');
        setLoading(false);
      }
    );

    // クリーンアップ関数
    return () => {
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current = null;
      }
      if (vrm) {
        vrm.dispose();
      }
    };
  }, [modelPath, scene]);

  // パラメータが変更されたときの処理
  useEffect(() => {
    if (!vrm || !parameters || parameters.length === 0) return;

    // パラメータの適用
    parameters.forEach(param => {
      const { parameterType, parameterName, value } = param;

      // パラメータタイプに応じた処理
      switch (parameterType) {
        case 'pose':
          // ポーズパラメータの適用
          applyPoseParameter(vrm, parameterName, value);
          break;
        case 'face':
          // 表情パラメータの適用
          applyFaceParameter(vrm, parameterName, value);
          break;
        case 'material':
          // マテリアルパラメータの適用
          applyMaterialParameter(vrm, parameterName, value);
          break;
        default:
          console.warn(`未知のパラメータタイプ: ${parameterType}`);
      }
    });

  }, [parameters, vrm]);

  // ポーズパラメータの適用関数
  const applyPoseParameter = (vrm: VRM, parameterName: string, value: number) => {
    // ヒューマノイドボーンの取得
    const humanoid = vrm.humanoid;
    if (!humanoid) return;

    // パラメータ名に応じたボーンの回転設定
    if (parameterName === 'headRotationX') {
      const head = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Head);
      if (head) {
        head.rotation.x = value;
      }
    } else if (parameterName === 'headRotationY') {
      const head = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Head);
      if (head) {
        head.rotation.y = value;
      }
    } else if (parameterName === 'headRotationZ') {
      const head = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Head);
      if (head) {
        head.rotation.z = value;
      }
    } else if (parameterName === 'spineRotationX') {
      const spine = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Spine);
      if (spine) {
        spine.rotation.x = value;
      }
    } else if (parameterName === 'spineRotationY') {
      const spine = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Spine);
      if (spine) {
        spine.rotation.y = value;
      }
    } else if (parameterName === 'spineRotationZ') {
      const spine = humanoid.getNormalizedBoneNode(VRMSchema.HumanoidBoneName.Spine);
      if (spine) {
        spine.rotation.z = value;
      }
    }
  };

  // 表情パラメータの適用関数
  const applyFaceParameter = (vrm: VRM, parameterName: string, value: number) => {
    // ブレンドシェイプの取得
    const blendShapeProxy = vrm.blendShapeProxy;
    if (!blendShapeProxy) return;

    // パラメータ名に応じたブレンドシェイプの設定
    switch (parameterName) {
      case 'happy':
        blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Joy, value);
        break;
      case 'sad':
        blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Sorrow, value);
        break;
      case 'angry':
        blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Angry, value);
        break;
      case 'surprised':
        blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Surprised, value);
        break;
      case 'blink':
        blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.Blink, value);
        break;
      default:
        console.warn(`未知の表情パラメータ: ${parameterName}`);
    }
  };

  // マテリアルパラメータの適用関数
  const applyMaterialParameter = (vrm: VRM, parameterName: string, value: number) => {
    // モデルのマテリアル取得
    if (!vrm.scene) return;

    vrm.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            // パラメータ名に応じたマテリアル設定
            switch (parameterName) {
              case 'opacity':
                material.opacity = value;
                material.transparent = value < 1.0;
                break;
              case 'metallic':
                material.metalness = value;
                break;
              case 'roughness':
                material.roughness = value;
                break;
              default:
                console.warn(`未知のマテリアルパラメータ: ${parameterName}`);
            }
          }
        });
      }
    });
  };

  // アニメーションフレームごとの更新
  useFrame((_, delta) => {
    if (vrm) {
      // VRMの更新処理
      vrm.update(delta);
    }
  });

  return null; // Three.jsのシーンに直接追加するため、何も返さない
};

const VRMViewer: React.FC<VRMViewerProps> = ({ modelPath, parameters }) => {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas
        camera={{ position: [0, 1.5, 2], fov: 50 }}
        shadows
      >
        {/* 環境光 */}
        <ambientLight intensity={0.5} />
        
        {/* 指向性ライト */}
        <directionalLight 
          position={[1, 2, 3]} 
          intensity={1} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024}
        />
        
        {/* VRMモデル */}
        <VRMModel modelPath={modelPath} parameters={parameters} />
        
        {/* カメラコントロール */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={5}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
};

export default VRMViewer;
