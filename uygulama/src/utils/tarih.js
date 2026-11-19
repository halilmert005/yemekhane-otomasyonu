function bugunTarih() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

function tarihEkle(tarihStr, gun) {
  const [yil, ay, gunNo] = tarihStr.split('-').map(Number);
  const tarih = new Date(Date.UTC(yil, ay - 1, gunNo + gun));
  return tarih.toISOString().slice(0, 10);
}

function gecerliTarihMi(tarihStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(tarihStr);
}

module.exports = {
  bugunTarih,
  tarihEkle,
  gecerliTarihMi,
};
