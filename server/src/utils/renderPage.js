export function renderPage(res, layout, view, data, next) {
  res.render(view, data, (err, html) => {
    if (err) return next ? next(err) : res.status(500).send(err.message)
    res.render(`layouts/${layout}`, { ...data, body: html })
  })
}

export default { renderPage }
