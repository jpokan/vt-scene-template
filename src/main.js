import "./style.css"
import * as THREE from "three"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Pane } from "tweakpane"
import * as EssentialsPlugin from "@tweakpane/plugin-essentials"

/**
 * Debug
 */
const pane = new Pane()
pane.registerPlugin(EssentialsPlugin)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const parameters = {
  background: "#89b5c8",
  animate: false,
}

const pane_status = pane.addFolder({
  title: "status",
  expanded: false,
})

const fpsGraph = pane_status.addBlade({
  view: "fpsgraph",
})

pane_status
  .addInput(parameters, "background", { label: "bg_color" })
  .on("change", (color) => {
    canvas.style.background = `radial-gradient(circle at 50%, ${color.value}, #65757c)`
  })
pane_status
  .addButton({ title: parameters.animate ? "Pause" : "Play", label: "animate" })
  .on("click", (event) => {
    parameters.animate = !parameters.animate
    if (parameters.animate) {
      event.target.title = "Pause"
    } else {
      event.target.title = "Play"
    }
  })

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

const uniforms = {
  u_time: { value: 0.0 },
  u_mouse: { value: new THREE.Vector3() },
  u_radius: { value: 1.0 },
}

pane_status.addInput(uniforms.u_time, "value", {
  disabled: true,
  label: "u_time",
})
pane_status.addInput(uniforms.u_mouse, "value", {
  disabled: true,
  label: "u_mouse",
})

const gui_shader = pane.addFolder({
  title: "shader",
  expanded: false,
})

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()
const bakedTexture = textureLoader.load("baked.jpg")
bakedTexture.encoding = THREE.sRGBEncoding
bakedTexture.flipY = false

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath("draco/")

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

gltfLoader.load("ico.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    child.material = bakedMaterial
  })
  scene.add(gltf.scene)
})

/**
 * Materials
 */
// Baked material
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

/**
 * Resizer
 */
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */

// Perspective Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.set(0, 0, 2)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.update()

/**
 * Mouse
 */
window.addEventListener("mousemove", (event) => {
  uniforms.u_mouse.value.x = (event.clientX / sizes.width) * 2 - 1
  uniforms.u_mouse.value.y = -(event.clientY / sizes.height) * 2 + 1

  // refresh pane on mousemove if animate is false
  if (!parameters.animate) {
    requestAnimationFrame(() => {
      pane.refresh()
    })
  }
})
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

// Clock
const clock = new THREE.Clock()

/**
 * Animate
 */
const tick = () => {
  fpsGraph.begin()

  const delta = clock.getDelta()

  if (parameters.animate) {
    uniforms.u_time.value += delta
    // refresh pane on tick if animate is true
    pane.refresh()
  }
  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  fpsGraph.end()
  // Call tick again on the next frame
  requestAnimationFrame(tick)
}

tick()
