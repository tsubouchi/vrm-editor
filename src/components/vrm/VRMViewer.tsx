'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { DropZone } from '@/components/ui/dropzone';
import { Squares } from '@/components/ui/squares-background';

// バージョン情報をコンソールに出力
console.log('THREE.js version:', THREE.REVISION);
console.log('@pixiv/three-vrm modules:', Object.keys(require('@pixiv/three-vrm')));

interface VRMViewerProps {
  modelPath?: string;
  parameters?: {
    parameterType: string;
    parameterName: string;
    value: number;
  }[];
}

const VRMModel: React.FC<{ 
  modelPath?: string;
  vrmFile?: File;
  parameters?: {
    parameterType: string;
    parameterName: string;
    value: number;
  }[];
}> = ({ modelPath, vrmFile, parameters }) => {
  const { scene, camera } = useThree();
  const modelRef = useRef<THREE.Group | null>(null);
  const [vrm, setVrm] = useState<VRM | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const animationRef = useRef<number>(0);

  // デバッグ用：カメラ情報をコンソールに出力
  useEffect(() => {
    console.log('カメラ位置:', camera.position);
    console.log('カメラの向き:', camera.rotation);
  }, [camera]);

  const loadVRMFromPath = useCallback((path: string) => {
    // VRMローダーの設定
    const loader = new GLTFLoader();
    
    // VRMプラグインを追加
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    setLoading(true);
    setError(null);

    console.log('VRMモデルをパスから読み込み開始:', path);

    // VRMモデルのロード
    loader.load(
      path,
      (gltf) => {
        // VRMインスタンスを取得
        const vrm = gltf.userData.vrm;
        
        if (!vrm) {
          console.error('VRMデータが見つかりませんでした:', gltf);
          setError('VRMモデルが正しく読み込まれませんでした');
          setLoading(false);
          return;
        }
        
        console.log('VRMモデルの読み込みに成功:', vrm);
        
        // シーンのクリーンアップ
        if (modelRef.current) {
          scene.remove(modelRef.current);
        }
        
        // モデルのスケール調整
        vrm.scene.scale.set(1.0, 1.0, 1.0);
        
        // モデルの回転調整（Y軸で180度回転させて正面を向かせる）
        vrm.scene.rotation.y = 0;
        
        // モデルの位置調整（床に埋まらないようにする）
        vrm.scene.position.set(0, 0.1, 0);
        
        // モデルの設定
        vrm.scene.castShadow = false;
        vrm.scene.receiveShadow = false;
        
        // モデル内のメッシュ設定
        vrm.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = false;
            object.receiveShadow = false;
            
            // マテリアルの強化
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach(material => {
                if (material instanceof THREE.MeshStandardMaterial) {
                  material.envMapIntensity = 1.5;
                  material.needsUpdate = true;
                }
                // シェーダーマテリアルの場合
                if (material && material.type === 'ShaderMaterial') {
                  // VRMマテリアルの場合、内部シャドウ定数を無効化する
                  if (material.uniforms && material.uniforms.receiveShadow) {
                    material.uniforms.receiveShadow.value = false;
                  }
                }
              });
            }
          }
        });
        
        // モデルをシーンに追加
        scene.add(vrm.scene);
        
        // 参照を保持
        modelRef.current = vrm.scene;
        setVrm(vrm);
        
        // 読み込み完了
        setLoading(false);
        
        // カメラの位置調整
        camera.position.set(0, 1.2, 1.8);
        camera.lookAt(0, 0.8, 0);
        
        console.log('VRMモデルの読み込みとセットアップが完了しました');
      },
      (progress) => {
        // 進行状況
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        console.log(`ロード進行状況: ${percentage}%`);
      },
      (error) => {
        // エラー処理
        console.error('VRMモデルの読み込みに失敗しました:', error);
        setError(`読み込みエラー: ${error.message}`);
        setLoading(false);
      }
    );
  }, [scene, camera]);

  const loadVRMFromFile = useCallback((file: File) => {
    // VRMローダーの設定
    const loader = new GLTFLoader();
    
    // VRMプラグインを追加
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });

    setLoading(true);
    setError(null);
    
    console.log('VRMファイルから読み込み開始:', file.name);
    
    // FileReaderを使用してファイルを読み込む
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        setError('ファイルの読み込みに失敗しました');
        setLoading(false);
        return;
      }
      
      const arrayBuffer = e.target.result as ArrayBuffer;
      
      // ArrayBufferからVRMモデルをロード
      loader.parse(
        arrayBuffer,
        '',
        (gltf) => {
          // VRMインスタンスを取得
          const vrm = gltf.userData.vrm;
          
          if (!vrm) {
            console.error('VRMデータが見つかりませんでした:', gltf);
            setError('VRMモデルが正しく読み込まれませんでした');
            setLoading(false);
            return;
          }
          
          console.log('VRMモデルの読み込みに成功:', vrm);
          
          // シーンのクリーンアップ
          if (modelRef.current) {
            scene.remove(modelRef.current);
          }
          
          // モデルのスケール調整
          vrm.scene.scale.set(1.0, 1.0, 1.0);
          
          // モデルの回転調整（Y軸で180度回転させて正面を向かせる）
          vrm.scene.rotation.y = 0;
          
          // モデルの位置調整（0.5上に配置して床に埋まらないようにする）
          vrm.scene.position.set(0, 0.5, 0);
          
          // モデルの設定
          vrm.scene.castShadow = false;
          vrm.scene.receiveShadow = false;
          
          // モデル内のメッシュ設定
          vrm.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = false;
              object.receiveShadow = false;
              
              // マテリアルの強化
              if (object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach(material => {
                  if (material instanceof THREE.MeshStandardMaterial) {
                    material.envMapIntensity = 1.0;
                  }
                });
              }
            }
          });
          
          // シーンに追加
          scene.add(vrm.scene);
          
          // 参照を保存
          modelRef.current = vrm.scene;
          setVrm(vrm);
          setLoading(false);
          
          console.log('VRMモデルをシーンに追加しました');
        },
        (error) => {
          console.error('VRMモデルの解析に失敗しました:', error);
          setError(`モデルの解析に失敗しました: ${error.message || 'Unknown error'}`);
          setLoading(false);
        }
      );
    };
    
    reader.onerror = () => {
      console.error('ファイルの読み込みに失敗しました');
      setError('ファイルの読み込みに失敗しました');
      setLoading(false);
    };
    
    // ファイルをArrayBufferとして読み込む
    reader.readAsArrayBuffer(file);
  }, [scene]);

  // モデルのロード
  useEffect(() => {
    if (modelPath) {
      loadVRMFromPath(modelPath);
    }
    
    // クリーンアップ関数
    return () => {
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current = null;
      }
    };
  }, [modelPath, loadVRMFromPath, scene]);

  // ファイルからのロード
  useEffect(() => {
    if (vrmFile) {
      loadVRMFromFile(vrmFile);
    }
  }, [vrmFile, loadVRMFromFile]);

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
    if (!vrm.humanoid) return;
    
    try {
      // パラメータ名に基づいてボーンと回転軸を決定
      let boneName: string | null = null;
      let rotationAxis: 'x' | 'y' | 'z' = 'y';
      
      // パラメータ名からボーン名と回転軸を抽出
      if (parameterName.startsWith('headRotation')) {
        boneName = 'head';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('spineRotation')) {
        boneName = 'spine';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('leftArmRotation')) {
        boneName = 'leftUpperArm';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('rightArmRotation')) {
        boneName = 'rightUpperArm';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('leftHandRotation')) {
        boneName = 'leftHand';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('rightHandRotation')) {
        boneName = 'rightHand';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('leftLegRotation')) {
        boneName = 'leftUpperLeg';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('rightLegRotation')) {
        boneName = 'rightUpperLeg';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('leftFootRotation')) {
        boneName = 'leftFoot';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else if (parameterName.startsWith('rightFootRotation')) {
        boneName = 'rightFoot';
        rotationAxis = parameterName.charAt(parameterName.length - 1).toLowerCase() as 'x' | 'y' | 'z';
      } else {
        console.warn(`未知のポーズパラメータ: ${parameterName}`);
        return;
      }
      
      // ボーン名からVRMのボーンを取得する
      let targetBone = null;
      
      // VRM規格のボーン名に変換（VRM 0.x系とVRM 1.0系の両方に対応）
      const vrmBoneName = convertToVRMBoneName(boneName);
      
      if (vrmBoneName) {
        // まず標準化されたボーン取得APIを試す
        targetBone = vrm.humanoid.getNormalizedBoneNode(vrmBoneName as any) || 
                     vrm.humanoid.getRawBoneNode(vrmBoneName as any);
                     
        // 見つからない場合は名前ベースで検索
        if (!targetBone) {
          targetBone = Object.values(vrm.humanoid.humanBones).find(bone => 
            bone.node.name.toLowerCase().includes(boneName!.toLowerCase()))?.node;
        }
      }
      
      if (!targetBone) {
        console.warn(`ボーン '${boneName}' (VRM名: ${vrmBoneName}) が見つかりませんでした`);
        return;
      }
      
      // 値を角度（ラジアン）に変換して回転を適用
      const angle = value * Math.PI; // 値を-1.0～1.0と仮定して-π～πに変換
      
      // 軸に応じて回転を適用
      if (rotationAxis === 'x') {
        targetBone.rotation.x = angle;
      } else if (rotationAxis === 'y') {
        targetBone.rotation.y = angle;
      } else if (rotationAxis === 'z') {
        targetBone.rotation.z = angle;
      }
      
      // デバッグ用
      console.log(`ポーズパラメータを適用: ${boneName} (${vrmBoneName}) の ${rotationAxis}軸を ${angle}ラジアン回転`);
    } catch (error) {
      console.error('ポーズパラメータの適用中にエラーが発生しました:', error);
    }
  };
  
  // 内部ボーン名をVRM規格のボーン名に変換するヘルパー関数
  const convertToVRMBoneName = (internalName: string): string | null => {
    const boneMap: Record<string, string> = {
      'head': 'head',
      'neck': 'neck',
      'spine': 'spine',
      'hips': 'hips',
      'leftUpperArm': 'leftUpperArm',
      'leftLowerArm': 'leftLowerArm',
      'leftHand': 'leftHand',
      'rightUpperArm': 'rightUpperArm',
      'rightLowerArm': 'rightLowerArm',
      'rightHand': 'rightHand',
      'leftUpperLeg': 'leftUpperLeg',
      'leftLowerLeg': 'leftLowerLeg',
      'leftFoot': 'leftFoot',
      'rightUpperLeg': 'rightUpperLeg',
      'rightLowerLeg': 'rightLowerLeg',
      'rightFoot': 'rightFoot'
    };
    
    return boneMap[internalName] || null;
  };

  // 表情パラメータの適用関数
  const applyFaceParameter = (vrm: VRM, parameterName: string, value: number) => {
    if (!vrm.expressionManager) {
      console.warn('表情マネージャーが利用できません');
      return;
    }
    
    try {
      // 表情パラメータ名とVRMの表情プリセット名のマッピング
      const expressionMap: Record<string, string> = {
        'happy': 'happy',
        'angry': 'angry',
        'sad': 'sad',
        'surprised': 'surprised',
        'blink': 'blink', // まばたきの場合は両目を閉じる
        'blinkLeft': 'blinkLeft',
        'blinkRight': 'blinkRight',
        'neutral': 'neutral',
        'lookLeft': 'lookLeft',
        'lookRight': 'lookRight',
        'lookUp': 'lookUp',
        'lookDown': 'lookDown'
      };
      
      // 対応する表情名を取得
      const expressionName = expressionMap[parameterName];
      
      if (expressionName) {
        // 特殊なケース: まばたき
        if (parameterName === 'blink') {
          // 両方の目を閉じる
          vrm.expressionManager.setValue('blinkLeft', value);
          vrm.expressionManager.setValue('blinkRight', value);
        } else {
          // 指定された表情を適用
          vrm.expressionManager.setValue(expressionName, value);
        }
        
        // 表情を更新
        vrm.expressionManager.update();
        
        // デバッグ用
        console.log(`表情パラメータを適用: ${expressionName} = ${value}`);
      } else {
        console.warn(`未知の表情パラメータ: ${parameterName}`);
      }
    } catch (error) {
      console.error('表情パラメータの適用中にエラーが発生しました:', error);
    }
  };

  // マテリアルパラメータの適用関数
  const applyMaterialParameter = (vrm: VRM, parameterName: string, value: number) => {
    try {
      // マテリアル名の修正（metallic -> metalness）
      const fixedParamName = parameterName === 'metallic' ? 'metalness' : parameterName;
      // 透明度パラメータ名の修正（transparency -> opacity）
      const materialPropName = fixedParamName === 'transparency' ? 'opacity' : fixedParamName;
      
      let appliedToAny = false;
      
      vrm.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          // meshの場合のみmaterial属性にアクセスする
          const mesh = object as THREE.Mesh;
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            
            materials.forEach(material => {
              if (material instanceof THREE.MeshStandardMaterial || 
                  material instanceof THREE.MeshPhysicalMaterial) {
                // マテリアルプロパティの調整
                switch (materialPropName) {
                  case 'metalness':
                    material.metalness = value;
                    appliedToAny = true;
                    break;
                  case 'roughness':
                    material.roughness = value;
                    appliedToAny = true;
                    break;
                  case 'emissiveIntensity':
                    material.emissiveIntensity = value;
                    appliedToAny = true;
                    break;
                  case 'opacity':
                    material.opacity = value;
                    material.transparent = value < 1.0;
                    appliedToAny = true;
                    break;
                  default:
                    // その他のプロパティ
                    console.warn(`サポートされていないマテリアルプロパティ: ${materialPropName}`);
                    break;
                }
                
                material.needsUpdate = true;
              } else if (material.type === 'ShaderMaterial' || material.type === 'RawShaderMaterial') {
                // シェーダーマテリアルの場合
                const shaderMaterial = material as THREE.ShaderMaterial;
                if (shaderMaterial.uniforms) {
                  // VRMのMToonマテリアルや他のシェーダーマテリアルの透明度設定
                  if (materialPropName === 'opacity' && shaderMaterial.uniforms.opacity) {
                    shaderMaterial.uniforms.opacity.value = value;
                    // MToonマテリアルの場合、透明設定も変更する
                    if (shaderMaterial.uniforms.isTransparent !== undefined) {
                      shaderMaterial.uniforms.isTransparent.value = value < 1.0;
                    }
                    appliedToAny = true;
                  }
                  // 他のプロパティも設定できるように拡張可能
                }
                
                material.needsUpdate = true;
              }
            });
          }
        }
      });
      
      // デバッグ用
      if (appliedToAny) {
        console.log(`マテリアルパラメータを適用: ${parameterName} (${materialPropName}) = ${value}`);
      } else {
        console.warn(`マテリアルパラメータを適用できませんでした: ${parameterName} (${materialPropName}) = ${value}`);
      }
    } catch (error) {
      console.error('マテリアルパラメータの適用中にエラーが発生しました:', error);
    }
  };

  // アニメーションフレームごとの更新
  useFrame((state, delta) => {
    if (loading) {
      animationRef.current += delta;
      // ローディングアニメーションなどを追加できます
    }
    
    // VRMのアップデート
    if (vrm) {
      vrm.update(delta);
    }
    
    // パラメータの適用
    if (vrm && parameters && parameters.length > 0) {
      parameters.forEach(param => {
        const { parameterType, parameterName, value } = param;
        
        switch (parameterType) {
          case 'pose':
            applyPoseParameter(vrm, parameterName, value);
            break;
          case 'face':
            applyFaceParameter(vrm, parameterName, value);
            break;
          case 'material':
            applyMaterialParameter(vrm, parameterName, value);
            break;
          default:
            // 未知のパラメータタイプの場合は何もしない
            break;
        }
      });
    }
  });

  // ローディング状態の表示
  if (loading) {
    return (
      <group>
        <mesh position={[0, 1, 0]} rotation={[0, animationRef.current, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#4285F4" emissive="#2C5EAD" wireframe />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[0, -animationRef.current * 0.5, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshStandardMaterial color="#22A0F2" emissive="#1C85D9" transparent opacity={0.6} />
        </mesh>
        <spotLight position={[5, 5, 5]} angle={0.3} penumbra={1} intensity={1} castShadow />
        <Text
          position={[0, -0.5, 0]}
          color="#4285F4"
          fontSize={0.15}
          anchorX="center"
          anchorY="middle"
        >
          読み込み中...
        </Text>
      </group>
    );
  }

  // エラー状態の表示
  if (error) {
    return (
      <group>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FF5252" />
        </mesh>
        <Text
          position={[0, -0.5, 0]}
          color="#FF5252"
          fontSize={0.15}
          anchorX="center"
          anchorY="middle"
        >
          エラー: {error}
        </Text>
      </group>
    );
  }

  return null; // Three.jsのシーンに直接追加するため、何も返さない
};

// グリッド表示コンポーネント
const GridFloor = () => {
  return (
    <group>
      {/* グリッドヘルパー */}
      <gridHelper 
        args={[10, 20, '#555555', '#333333']} 
        position={[0, 0.01, 0]} 
        rotation={[0, 0, 0]}
      />
      
      {/* 床面 */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow={false}
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial 
          color="#111111" 
          roughness={0.8}
          metalness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>
    </group>
  );
};

const VRMViewer: React.FC<VRMViewerProps> = ({ modelPath, parameters }) => {
  const [vrmFile, setVrmFile] = useState<File | null>(null);
  const [hasModel, setHasModel] = useState<boolean>(!!modelPath);
  const [debugInfo, setDebugInfo] = useState<string>('準備完了');

  const handleFileDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const vrmFiles = files.filter(file => file.name.endsWith('.vrm'));
        if (vrmFiles.length > 0) {
          setDebugInfo(`VRMファイルをドロップ: ${vrmFiles[0].name}`);
          setVrmFile(vrmFiles[0]);
          setHasModel(true);
        } else {
          setDebugInfo('ドロップされたファイルはVRM形式ではありません');
        }
      }
    } catch (error) {
      console.error('ファイルのドロップ処理でエラーが発生しました:', error);
      setDebugInfo(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const handleFileSelect = () => {
    try {
      // ファイル選択ダイアログを表示
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.vrm';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          setDebugInfo(`VRMファイルを選択: ${target.files[0].name}`);
          setVrmFile(target.files[0]);
          setHasModel(true);
        }
      };
      input.click();
    } catch (error) {
      console.error('ファイル選択処理でエラーが発生しました:', error);
      setDebugInfo(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  if (!hasModel) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#0a0a0a] to-[#121212] rounded-lg overflow-hidden">
        <div className="relative h-full">
          <Squares 
            direction="diagonal"
            speed={0.5}
            squareSize={40}
            borderColor="#333333" 
            hoverFillColor="#222222"
            className="opacity-20"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              onClick={handleFileSelect}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="w-4/5 h-3/5 flex flex-col items-center justify-center bg-[#1a1a1a] border-dashed border-2 border-blue-500/50 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-[#1a1a1a]/70 transition-all duration-300"
            >
              <div className="p-4 bg-blue-500/10 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-center text-blue-300 mb-2 font-medium">
                VRMファイルをドロップするか、クリックして選択
              </p>
              <p className="text-xs text-gray-400 max-w-sm text-center">{debugInfo}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border-dark">
      <Canvas
        camera={{ position: [0, 1.2, 2], fov: 45 }}
        shadows={false}
        gl={{ 
          alpha: false,
          antialias: true, 
          preserveDrawingBuffer: true,
          logarithmicDepthBuffer: true
        }}
        style={{ 
          background: 'linear-gradient(to bottom, #111111, #050505)',
          width: '100%',
          height: '100%'
        }}
      >
        {/* パフォーマンスモニター（開発時のみ） */}
        {process.env.NODE_ENV === 'development' && <Stats />}
        
        {/* 環境光 - 強度を上げる */}
        <ambientLight intensity={0.8} />
        
        {/* 半球光 - 柔らかい光源 */}
        <hemisphereLight intensity={0.7} color="#ffffff" groundColor="#222222" />
        
        {/* 指向性ライト - 主光源 */}
        <directionalLight 
          position={[3, 10, 5]} 
          intensity={1.5} 
          castShadow={false} 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-near={0.1}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* フィルライト（影の部分を柔らかく照らす） */}
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.5} 
        />

        {/* 追加の光源（モデルの前面を照らす） */}
        <spotLight
          position={[0, 2, 3]}
          angle={0.6}
          penumbra={1}
          intensity={0.8}
          distance={10}
          castShadow={false}
        />
        
        {/* グリッド床 */}
        <GridFloor />
        
        {/* VRMモデル */}
        <VRMModel 
          modelPath={modelPath} 
          vrmFile={vrmFile || undefined}
          parameters={parameters} 
        />
        
        {/* カメラコントロール */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={5}
          target={[0, 0.9, 0]}
          minPolarAngle={Math.PI/6}
          maxPolarAngle={Math.PI*5/6}
          rotateSpeed={0.7}
          zoomSpeed={0.8}
          makeDefault
        />

        {/* フォグ効果（遠くのオブジェクトをぼかす） */}
        <fog attach="fog" args={['#000000', 5, 25]} />
      </Canvas>
    </div>
  );
};

export default VRMViewer;
