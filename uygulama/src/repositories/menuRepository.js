const { okumaHavuzu, yazmaHavuzu } = require('../config/db');
const { UygulamaHatasi } = require('../middleware/hataMiddleware');

async function yemekhaneleriGetir() {
  const [satirlar] = await okumaHavuzu.execute(
    'SELECT id, ad, konum, kapasite FROM yemekhaneler ORDER BY id'
  );
  return satirlar;
}

async function ogunleriGetir() {
  const [satirlar] = await okumaHavuzu.execute(
    'SELECT id, ad, sira, son_saat, servis_baslangic, servis_bitis FROM ogunler ORDER BY sira'
  );
  return satirlar;
}

async function yemekleriGetir() {
  const [satirlar] = await okumaHavuzu.execute(
    `SELECT y.id, y.ad, y.kalori, y.vejetaryen, k.id AS kategori_id, k.ad AS kategori, k.sira AS kategori_sira
       FROM yemekler y
       JOIN yemek_kategorileri k ON k.id = y.kategori_id
      ORDER BY k.sira, y.ad`
  );
  return satirlar;
}

async function menuleriGetir({ baslangicTarih, bitisTarih, yemekhaneId = null, ogunId = null }) {
  const kosullar = ['d.tarih BETWEEN ? AND ?'];
  const parametreler = [baslangicTarih, bitisTarih];

  if (yemekhaneId) {
    kosullar.push('d.yemekhane_id = ?');
    parametreler.push(yemekhaneId);
  }
  if (ogunId) {
    kosullar.push('d.ogun_id = ?');
    parametreler.push(ogunId);
  }

  const [basliklar] = await okumaHavuzu.execute(
    `SELECT d.menu_id, d.tarih, d.yemekhane_id, d.yemekhane, d.ogun_id, d.ogun,
            o.sira AS ogun_sira, d.kapasite, d.rezerve, d.bos_yer, d.doluluk_yuzde,
            d.rezervasyon_son, (NOW() >= d.rezervasyon_son) AS suresi_doldu,
            m.ogrenci_fiyati, m.personel_fiyati,
            COALESCE(p.oy_sayisi, 0) AS oy_sayisi, p.ortalama_puan
       FROM v_menu_doluluk d
       JOIN menuler m ON m.id = d.menu_id
       JOIN ogunler o ON o.id = d.ogun_id
       LEFT JOIN v_menu_puan p ON p.menu_id = d.menu_id
      WHERE ${kosullar.join(' AND ')}
      ORDER BY d.tarih, d.yemekhane_id, o.sira`,
    parametreler
  );

  if (basliklar.length === 0) {
    return [];
  }

  const menuIdleri = basliklar.map((m) => m.menu_id);
  const yerTutucular = menuIdleri.map(() => '?').join(',');

  const [yemekSatirlari] = await okumaHavuzu.execute(
    `SELECT menu_id, yemek_id, yemek, kategori_id, kategori, kategori_sira,
            kalori, vejetaryen, alerjenler, alerjen_idler
       FROM v_menu_detay
      WHERE menu_id IN (${yerTutucular})
      ORDER BY ogun_sira, kategori_sira, yemek`,
    menuIdleri
  );

  const yemekHaritasi = new Map();
  for (const satir of yemekSatirlari) {
    if (!yemekHaritasi.has(satir.menu_id)) {
      yemekHaritasi.set(satir.menu_id, []);
    }
    yemekHaritasi.get(satir.menu_id).push({
      yemek_id: satir.yemek_id,
      ad: satir.yemek,
      kategori_id: satir.kategori_id,
      kategori: satir.kategori,
      kategori_sira: satir.kategori_sira,
      kalori: satir.kalori,
      vejetaryen: Boolean(satir.vejetaryen),
      alerjenler: satir.alerjenler ? satir.alerjenler.split(', ') : [],
      alerjen_idler: satir.alerjen_idler
        ? satir.alerjen_idler.split(',').map((id) => Number(id))
        : [],
    });
  }

  return basliklar.map((menu) => {
    const yemekler = yemekHaritasi.get(menu.menu_id) || [];
    const toplamKalori = yemekler.reduce((toplam, y) => toplam + Number(y.kalori || 0), 0);
    return {
      ...menu,
      suresi_doldu: Boolean(menu.suresi_doldu),
      toplam_kalori: toplamKalori,
      yemekler,
    };
  });
}

async function menuOlustur({ yemekhaneId, tarih, ogunId, ogrenciFiyati, personelFiyati, yemekIdleri }) {
  const baglanti = await yazmaHavuzu.getConnection();
  try {
    await baglanti.beginTransaction();
    const [sonuc] = await baglanti.execute(
      `INSERT INTO menuler (yemekhane_id, tarih, ogun_id, ogrenci_fiyati, personel_fiyati)
       VALUES (?, ?, ?, ?, ?)`,
      [yemekhaneId, tarih, ogunId, ogrenciFiyati, personelFiyati]
    );
    const menuId = sonuc.insertId;

    if (yemekIdleri.length > 0) {
      const degerler = yemekIdleri.map((yemekId) => [menuId, yemekId]);
      await baglanti.query('INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?', [degerler]);
    }

    await baglanti.commit();
    return menuId;
  } catch (err) {
    await baglanti.rollback();
    if (err.errno === 1062) {
      throw new UygulamaHatasi(409, 'Bu yemekhane, tarih ve öğün için zaten menü tanımlı.');
    }
    throw err;
  } finally {
    baglanti.release();
  }
}

async function menuGuncelle(menuId, { ogrenciFiyati, personelFiyati, yemekIdleri }) {
  const baglanti = await yazmaHavuzu.getConnection();
  try {
    await baglanti.beginTransaction();

    const [mevcut] = await baglanti.execute(
      'SELECT id, yemekhane_id, tarih, ogun_id FROM menuler WHERE id = ? FOR UPDATE',
      [menuId]
    );
    if (mevcut.length === 0) {
      throw new UygulamaHatasi(404, 'Menü bulunamadı.');
    }

    await baglanti.execute(
      'UPDATE menuler SET ogrenci_fiyati = ?, personel_fiyati = ? WHERE id = ?',
      [ogrenciFiyati, personelFiyati, menuId]
    );

    await baglanti.execute('DELETE FROM menu_yemekleri WHERE menu_id = ?', [menuId]);

    if (yemekIdleri.length > 0) {
      const degerler = yemekIdleri.map((yemekId) => [menuId, yemekId]);
      await baglanti.query('INSERT INTO menu_yemekleri (menu_id, yemek_id) VALUES ?', [degerler]);
    }

    await baglanti.commit();
    return mevcut[0];
  } catch (err) {
    await baglanti.rollback();
    throw err;
  } finally {
    baglanti.release();
  }
}

module.exports = {
  yemekhaneleriGetir,
  ogunleriGetir,
  yemekleriGetir,
  menuleriGetir,
  menuOlustur,
  menuGuncelle,
};
