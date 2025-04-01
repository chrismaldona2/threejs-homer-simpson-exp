import {
  GLTFLoader,
  MTLLoader,
  OBJLoader,
  OrbitControls,
  Timer,
} from "three/examples/jsm/Addons.js";
import "./style.css";
import * as THREE from "three";
import { toggleFullscreen } from "./fullscreen";

/* SETUP */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const canvas = document.getElementById("canvas")!;

/* RESIZE HANDLER */
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* SCENE */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xafc9f7);

/* CAMERA */
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(-1.5, 3, 5);
scene.add(camera);

/* RENDERER */
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const render = () => {
  renderer.render(scene, camera);
};

/* ORBIT CONTROLS */
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(0, 1, 0);
orbitControls.enableDamping = true;

/* ANIMATION */
const timer = new Timer();

const animate = () => {
  window.requestAnimationFrame(animate);
  orbitControls.update();
  timer.update();
  const deltaTime = timer.getDelta();

  // HOMER ANIMATION
  if (homerMixer) homerMixer.update(deltaTime);

  // RAYCASTING
  raycaster.setFromCamera(mouse, camera);
  if (homer) {
    const intersect = raycaster.intersectObject(homer);

    if (intersect.length) {
      homerIntersect = intersect;
      window.document.body.style.cursor = "pointer";
    } else {
      homerIntersect = null;
      window.document.body.style.cursor = "default";
    }
  }

  render();
};

/* LOADERS */
const gltfLoader = new GLTFLoader();
const mtlLoader = new MTLLoader();

/* RAYCASTER SETUP */
// MOUSE
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -((event.clientY / sizes.height) * 2 - 1);
});

// RAYCASTER
const raycaster = new THREE.Raycaster();

/* OBJECTS */
// FLOOR
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.25, 64),
  new THREE.MeshStandardMaterial({ color: 0x8bab00, side: THREE.DoubleSide })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

// HOMER
let homer: THREE.Object3D<THREE.Object3DEventMap> | null = null;
let homerMixer: THREE.AnimationMixer | null = null;
gltfLoader.load(
  "./models/homer/scene.gltf",
  (gltf) => {
    homer = gltf.scene;
    homer.position.y -= 0.0082;
    homer.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
      }
    });
    homerMixer = new THREE.AnimationMixer(homer);
    const animation = homerMixer.clipAction(gltf.animations[0]);
    animation.play();
    scene.add(homer);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);
// HOMER RAYCAST INTERSECT
let homerIntersect:
  | THREE.Intersection<THREE.Object3D<THREE.Object3DEventMap>>[]
  | null = null;
// HOMER SOUND ON CLICK
const homerDohSound = new Audio("./sounds/homer-doh.mp3");
homerDohSound.volume = 0.5;
window.addEventListener("click", () => {
  if (homerIntersect?.length) homerDohSound.play();
});

// DUFF COOLER
mtlLoader.load("./models/duff-cooler/DuffCooler.mtl", (materials) => {
  materials.preload();
  const duffCoolerObjLoader = new OBJLoader();
  duffCoolerObjLoader.setMaterials(materials);
  duffCoolerObjLoader.load(
    "./models/duff-cooler/DuffCooler.obj",
    (obj) => {
      obj.position.set(1.5, -0.05, -0.5);
      obj.rotation.y = Math.PI / 1.5;

      obj.children[0].castShadow = true;

      scene.add(obj);
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );
});

// EBOLA COLA
// DUFF COOLER
mtlLoader.load(
  "./models/ebola-cola/big_gulp_of_pop_objShape.mtl",
  (materials) => {
    materials.preload();
    const ebolaColaObjLoader = new OBJLoader();
    ebolaColaObjLoader.setMaterials(materials);
    ebolaColaObjLoader.load(
      "./models/ebola-cola/big_gulp_of_pop_objShape.obj",
      (obj) => {
        obj.scale.setScalar(0.5);
        obj.position.set(-1, -0.01, 0.5);
        obj.children[0].castShadow = true;
        scene.add(obj);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
  }
);

/* LIGHTS */
// AMBIENT LIGHT
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// DIRECTIONAL LIGHT
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(2, 2, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 5.5;
directionalLight.shadow.camera.top = 1.5;
directionalLight.shadow.camera.right = 2;
directionalLight.shadow.camera.bottom = -1;
directionalLight.shadow.camera.left = -1.5;

scene.add(ambientLight, directionalLight);

/* FULLSCREEN */
window.addEventListener("keydown", (event) => {
  switch (event.key.toLowerCase()) {
    case "f":
      toggleFullscreen(renderer.domElement);
  }
});
renderer.domElement.addEventListener("dblclick", () =>
  toggleFullscreen(renderer.domElement)
);

animate();
