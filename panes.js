// Projects page: a preview card that follows the cursor over a repo row.
// Pointer-only; on touch the rows are plain links.
;(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const card = document.querySelector('.preview')
  const rows = document.querySelectorAll('.proj-list a[data-thumb]')
  if (!card || !rows.length) return

  const frame = card.querySelector('.preview__img')
  const cap = card.querySelector('.preview__cap')
  const failed = new Set()
  let hot = null

  const fallback = () => {
    frame.textContent = '[ screenshot / diagram ]'
  }

  const show = (row) => {
    if (hot === row) return
    hot?.classList.remove('is-hot')
    hot = row
    row.classList.add('is-hot')
    const src = row.dataset.thumb
    cap.textContent = row.dataset.tags
    frame.textContent = ''
    if (!src || failed.has(src)) return fallback()
    const img = new Image()
    img.alt = ''
    img.src = src
    img.onerror = () => {
      failed.add(src)
      if (hot === row) fallback()
    }
    frame.append(img)
    card.hidden = false
  }

  const hide = () => {
    hot?.classList.remove('is-hot')
    hot = null
    card.hidden = true
  }

  const place = (e) => {
    const w = card.offsetWidth
    const h = card.offsetHeight
    const x = Math.min(e.clientX + 20, innerWidth - w - 16)
    const y = e.clientY + 20 + h > innerHeight ? e.clientY - h - 20 : e.clientY + 20
    card.style.transform = `translate(${x}px, ${Math.max(8, y)}px)`
  }

  for (const row of rows) {
    row.addEventListener('mouseenter', (e) => {
      show(row)
      card.hidden = false
      place(e)
    })
    row.addEventListener('mousemove', place)
    row.addEventListener('mouseleave', hide)
  }
  addEventListener('scroll', hide, { passive: true })
})()
