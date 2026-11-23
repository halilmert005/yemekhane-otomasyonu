async function apiIstek(yol, secenekler = {}) {
  const ayarlar = {
    method: secenekler.method || 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(secenekler.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(secenekler.body !== undefined ? { body: JSON.stringify(secenekler.body) } : {}),
  };

  const yanit = await fetch('/api' + yol, ayarlar);
  let veri = {};
  try {
    veri = await yanit.json();
  } catch {
    veri = {};
  }

  if (!yanit.ok) {
    const hata = new Error(veri.hata || 'İşlem sırasında hata oluştu.');
    hata.durumKodu = yanit.status;
    throw hata;
  }

  return veri;
}
