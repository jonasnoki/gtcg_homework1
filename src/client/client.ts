import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// @ts-ignore
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { ArrowHelper, Matrix3, Matrix4, Mesh, MeshNormalMaterial, SphereGeometry, Vector3 } from 'three'

const params = {
    useCameraRide: false,
    pause: false,
    x: -2.00001,
    t: new Vector3(0.01, 0.01, 0.01),
    n: new Vector3(0.01, 0.01, 0.01),
    b: new Vector3(0.01, 0.01, 0.01),
    curvature: 0.001,
    torsion: 0.001,
}

const scene = new THREE.Scene()

const path = './assets/Park2/'
const format = '.jpg'
const urls = [
    path + 'posx' + format, path + 'negx' + format,
    path + 'posy' + format, path + 'negy' + format,
    path + 'posz' + format, path + 'negz' + format,
]

const textureCube = new THREE.CubeTextureLoader().load(urls)

textureCube.rotation = Math.PI / 4;
scene.background = textureCube

const linePoints = []
for (let i = -2; i < 2; i += 0.01) {
    linePoints.push(f(i))
}

//create a blue LineBasicMaterial
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff })
const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints)
const line = new THREE.Line(lineGeometry, lineMaterial)
scene.add(line)


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 5

const camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.00001, 1000)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

const arrowT = new ArrowHelper(undefined, undefined, 1, 0xff0000)
const arrowN = new ArrowHelper(undefined, undefined, 1, 0x00ff00)
const arrowB = new ArrowHelper(undefined, undefined, 1, 0x0000ff)

scene.add(arrowT, arrowN, arrowB)


const currentCameraGeometry = new SphereGeometry(0.1)
const currentCameraMaterial = new MeshNormalMaterial()
const currentCameraMesh = new Mesh(currentCameraGeometry, currentCameraMaterial)

scene.add(currentCameraMesh)

const geometry = new THREE.SphereGeometry(0.5)
const material = new THREE.MeshBasicMaterial({ color: 0xffffff, envMap: textureCube })
material.reflectivity = 0.9

const sphere = new THREE.Mesh(geometry, material)
sphere.position.copy(new Vector3(-.5, .5, 1))

scene.add(sphere)

const point111Geometry = new SphereGeometry(0.1)
const point111Mesh = new Mesh(point111Geometry, material)

scene.add(point111Mesh)
point111Mesh.position.copy(f(1))

const gui = new GUI({ width: 400 })
gui.add(params, 'useCameraRide')
    .name('Use Camera Ride')

gui.add(params, 'pause')
    .name('pause')
    .listen()

gui.add(params, 'x', -2, 2)
    .name('X')
    .onChange(() => params.pause = true)

gui.add(params, 'curvature')
    .name('Curvature')
    .listen()

gui.add(params, 'torsion')
    .name('Torsion')
    .listen()

const tFolder = gui.addFolder('T')
tFolder.add(params.t, 'x').listen()
tFolder.add(params.t, 'y').listen()
tFolder.add(params.t, 'z').listen()


const nFolder = gui.addFolder('N')
nFolder.add(params.n, 'x').listen()
nFolder.add(params.n, 'y').listen()
nFolder.add(params.n, 'z').listen()


const bFolder = gui.addFolder('B')
bFolder.add(params.b, 'x').listen()
bFolder.add(params.b, 'y').listen()
bFolder.add(params.b, 'z').listen()

let dt = 0

window.addEventListener('resize', onWindowResize, false)

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function f(x: number) {
    return new THREE.Vector3(x, x * x, x * x * x)
}

function f_derived(x: number) {
    return new THREE.Vector3(1, 2 * x, 3 * x * x)
}

function f_derived_derived(x: number) {
    return new THREE.Vector3(0, 2, 6 * x)
}

function f_derived_derived_derived(x: number) {
    return new THREE.Vector3(0, 0, 6)
}

function curvature(x: number): number {
    const t = f_derived(x)
    return t.clone().cross(f_derived_derived(x)).length() / Math.pow(t.length(), 3)
}

function torsion(x: number): number {
    const f_ = f_derived(x)
    const f__ = f_derived_derived(x)
    const f___ = f_derived_derived_derived(x)

    return f_.clone().cross(f__).dot(f___)/Math.pow(f_.clone().cross(f__).length(), 2);
}

function animate() {
    requestAnimationFrame(animate)

    if (!params.pause) {
        dt++
        params.x = ((dt / 50) % 4) - 2
    }

    params.curvature = curvature(params.x)
    params.torsion = torsion(params.x)

    const position = f(params.x)
    arrowT.position.copy(position)
    arrowN.position.copy(position)
    arrowB.position.copy(position)

    params.t.copy(f_derived(params.x).normalize())
    params.b.copy(params.t.clone().cross(f_derived_derived(params.x)).normalize())
    params.n.copy(params.t.clone().cross(params.b))

    arrowT.setDirection(params.t)
    arrowN.setDirection(params.n)
    arrowB.setDirection(params.b)

    currentCameraMesh.position.copy(position)
    camera2.position.copy(position)
    camera2.up.copy(params.b)
    camera2.lookAt(position.add(params.t))

    controls.update()

    render()
}

function render() {
    renderer.render(scene, params.useCameraRide ? camera2 : camera)
}

animate()
