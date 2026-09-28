// The loss-landscape figure above the name: design 7c, ported exactly from the
// design's casella-3d.js (subject "landscape"). three.js draws the scene into a
// tiny render target, one pixel per character cell, and each pixel's luminance
// picks a glyph. A ball wanders the non-convex surface with momentum, steering
// toward random targets and leaving a short trail.
//
// The build bakes a still frame into the <pre> (tools/landscape-still.mjs), so
// the figure is there before three.js loads, or if it never does.
;(function () {
  const pres = document.querySelectorAll('pre[data-landscape]')
  if (!pres.length) return
  const THREE_URL = 'https://unpkg.com/three@0.160.0/build/three.module.js'
  let tp
  const loadThree = () => tp || (tp = import(THREE_URL))
  let SR
  const shared = (T) => {
    if (!SR) {
      SR = new T.WebGLRenderer({ antialias: true, alpha: true })
      SR.setPixelRatio(1)
      SR.setClearColor(0, 0)
      SR.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault())
    }
    return SR
  }
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches

  // A policy descending a non-convex loss surface.
  function buildLandscape(T) {
    const g = new T.Group()
    const f = (x, z) =>
      -1.1 * Math.exp(-((x - 0.8) ** 2 + (z + 0.5) ** 2) / 0.5) -
      0.6 * Math.exp(-((x + 1) ** 2 + (z - 0.9) ** 2) / 0.4) +
      0.08 * (x * x + z * z) +
      0.1 * Math.sin(2 * x) * Math.cos(2 * z)
    const geo = new T.PlaneGeometry(4.4, 4.4, 90, 90)
    geo.rotateX(-Math.PI / 2)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, f(p.getX(i), p.getZ(i)))
    geo.computeVertexNormals()
    g.add(new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.5 })))
    const ball = new T.Mesh(new T.SphereGeometry(0.16, 20, 14), new T.MeshBasicMaterial({ color: 0xffffff }))
    g.add(ball)
    const trail = Array.from({ length: 7 }, (_, i) => {
      const m = new T.Mesh(new T.SphereGeometry(0.1 - i * 0.01, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff }))
      g.add(m)
      return m
    })
    const B = 2.05, hist = []
    let x = -1.7, z = 1.8, vx = 0, vz = 0, n = 0, tgx = 0, tgz = 0
    const pick = () => {
      tgx = (Math.random() * 2 - 1) * B * 0.9
      tgz = (Math.random() * 2 - 1) * B * 0.9
    }
    pick()
    const stepBall = () => {
      const dx = tgx - x, dz = tgz - z, d = Math.hypot(dx, dz) || 1
      if (d < 0.15 || Math.random() < 0.004) pick()
      vx = 0.94 * vx + (dx / d) * 0.0018 + (Math.random() - 0.5) * 0.0016
      vz = 0.94 * vz + (dz / d) * 0.0018 + (Math.random() - 0.5) * 0.0016
      const sp = Math.hypot(vx, vz), mx = 0.035
      if (sp > mx) (vx *= mx / sp), (vz *= mx / sp)
      x += vx
      z += vz
      if (Math.abs(x) > B) (x = Math.sign(x) * B), (vx *= -0.6), pick()
      if (Math.abs(z) > B) (z = Math.sign(z) * B), (vz *= -0.6), pick()
      if (++n % 4 === 0) {
        hist.unshift([x, z])
        hist.length = Math.min(hist.length, trail.length)
      }
    }
    let last = 0
    return {
      group: g,
      zoomMul: 1.05,
      update: (t) => {
        g.rotation.set(0.55, 0.7, 0)
        const steps = last ? Math.min(6, Math.max(1, Math.round((t - last) / 16))) : 1
        last = t
        for (let i = 0; i < steps; i++) stepBall()
        ball.position.set(x, f(x, z) + 0.16, z)
        trail.forEach((m, i) => {
          const q = hist[i + 1]
          m.visible = !!q
          if (q) m.position.set(q[0], f(q[0], q[1]) + 0.1, q[1])
        })
      },
    }
  }

  // As the design mounts it: height 220, offset 0, zoom 5.4. The design card is
  // 61 columns wide; on a narrower column the camera pulls back in proportion,
  // plus 8% more, so the whole terrain sits inside the frame with a margin.
  const DESIGN_COLS = 61
  async function mount(pre) {
    const h = (+pre.dataset.rows || 22) * 10
    const T = await loadThree()
    const cols = Math.max(20, Math.floor((pre.clientWidth || 760) / 6)), rows = Math.floor(h / 10)
    const renderer = shared(T)
    const rt = new T.WebGLRenderTarget(cols, rows)
    const scene = new T.Scene()
    const cam = new T.PerspectiveCamera(38, (cols * 6) / (rows * 10), 0.1, 50)
    const subj = buildLandscape(T)
    subj.group.position.x = 0
    cam.position.z = 5.4 * subj.zoomMul * Math.max(1, DESIGN_COLS / cols) * 1.08
    scene.add(subj.group, new T.AmbientLight(0xffffff, 0.12))
    const key = new T.DirectionalLight(0xffffff, 2.4)
    key.position.set(-3, 3, 4)
    scene.add(key)
    const buf = new Uint8Array(cols * rows * 4), ramp = ' .,:-=+*#%@'
    let on = true, raf
    const frame = (t) => {
      subj.update(t)
      renderer.setRenderTarget(rt)
      renderer.render(scene, cam)
      renderer.readRenderTargetPixels(rt, 0, 0, cols, rows, buf)
      let s = ''
      for (let y = rows - 1; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const l = (buf[i] * 0.3 + buf[i + 1] * 0.59 + buf[i + 2] * 0.11) / 255
          s += ramp[Math.min(ramp.length - 1, Math.floor(l * ramp.length))]
        }
        s += '\n'
      }
      pre.textContent = s
      if (on && !reduce()) raf = requestAnimationFrame(frame)
    }
    new IntersectionObserver(
      (es) => {
        on = es[0].isIntersecting
        cancelAnimationFrame(raf)
        if (on) raf = requestAnimationFrame(frame)
      },
      { threshold: 0 },
    ).observe(pre)
    frame(0)
  }

  // Mount (and fetch three.js) only once the figure is actually on screen: some
  // layouts hide it on phones, and those should not download the library.
  // No three.js at all: the baked still stays.
  pres.forEach((pre) => {
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting || !pre.clientWidth) return
      io.disconnect()
      mount(pre).catch(() => {})
    })
    io.observe(pre)
  })
})()
