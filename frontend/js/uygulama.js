const durum = {
  kullanici: null,
  yemekhaneler: [],
  ogunler: [],
  tumYemekler: [],
  tumAlerjenler: [],
  kullaniciAlerjenIdleri: [],
  duzenlenenMenuId: null,
  yoneticiMenuler: [],
};

const ROL_ADLARI = {
  ogrenci: 'Öğrenci',
  personel: 'Personel',
  yonetici: 'Yönetici',
};

const REZ_DURUM_ADLARI = {
  aktif: 'Aktif',
  kullanildi: 'Kullanıldı',
  iptal: 'İptal',
};

const PORSIYON_ADLARI = {
  tam: 'Tam',
  yarim: 'Yarım',
};

const HAREKET_TURLERI = {
  yukleme: 'Yükleme',
  rezervasyon: 'Rezervasyon',
  iade: 'İade',
};

function el(etiket, ozellikler = {}, icerik = []) {
  const dugum = document.createElement(etiket);
  for (const [anahtar, deger] of Object.entries(ozellikler)) {
    if (anahtar === 'className') {
      dugum.className = deger;
    } else if (anahtar === 'textContent') {
      dugum.textContent = deger;
    } else if (anahtar === 'checked' || anahtar === 'disabled') {
      dugum[anahtar] = Boolean(deger);
    } else if (anahtar.startsWith('on') && typeof deger === 'function') {
      dugum.addEventListener(anahtar.slice(2).toLowerCase(), deger);
    } else if (deger !== false && deger !== null && deger !== undefined) {
      dugum.setAttribute(anahtar, deger === true ? '' : String(deger));
    }
  }
  const parcalar = Array.isArray(icerik) ? icerik : [icerik];
  for (const parca of parcalar) {
    if (parca === null || parca === undefined) continue;
    dugum.append(typeof parca === 'string' ? document.createTextNode(parca) : parca);
  }
  return dugum;
}

function paraBicimle(tutar) {
  return Number(tutar || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' TL';
}

function bugunMetni() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
}

function mesajGoster(metin, hataMi = false) {
  const kutu = document.getElementById('mesaj-kutusu');
  kutu.textContent = metin;
  kutu.className = 'bildirim ' + (hataMi ? 'bildirim-hata' : 'bildirim-basari');
  kutu.setAttribute('role', hataMi ? 'alert' : 'status');
}

function mesajTemizle() {
  const kutu = document.getElementById('mesaj-kutusu');
  kutu.textContent = '';
  kutu.className = 'bildirim gizli';
}

function bakiyeGuncelle(yeniBakiye) {
  if (durum.kullanici) {
    durum.kullanici.bakiye = yeniBakiye;
  }
  const metin = paraBicimle(yeniBakiye);
  document.getElementById('ust-bakiye').textContent = metin;
  document.getElementById('bakiye-buyuk').textContent = metin;
}

function kisaBekle(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function secenekleriDoldur(selectEl, liste, hepsiEtiketi = null) {
  selectEl.replaceChildren();
  if (hepsiEtiketi) {
    selectEl.append(el('option', { value: '', textContent: hepsiEtiketi }));
  }
  for (const oge of liste) {
    selectEl.append(el('option', { value: oge.id, textContent: oge.ad }));
  }
}

function menuKartiOlustur(menu, rezervasyonGoster = true) {
  const kart = el('article', { className: 'kart' });

  const fiyatMetni = menu.yarim_porsiyon_destekli
    ? `${paraBicimle(menu.kullanici_fiyati)} (Yarım: ${paraBicimle(menu.yarim_porsiyon_fiyati)})`
    : paraBicimle(menu.kullanici_fiyati);

  const baslik = el('div', { className: 'menu-baslik' }, [
    el('div', {}, [
      el('h3', { textContent: `${menu.yemekhane} · ${menu.ogun}` }),
      el('span', { className: 'uyari-metin', textContent: menu.tarih }),
    ]),
    el('div', { className: 'menu-meta' }, [
      el('span', { className: 'rozet rozet-bilgi', textContent: `${menu.toplam_kalori} kcal` }),
      el('span', { className: 'rozet rozet-bilgi', textContent: `Boş yer: ${menu.bos_yer}/${menu.kapasite}` }),
      el('span', { className: 'rozet rozet-fiyat', textContent: fiyatMetni }),
    ]),
  ]);
  kart.append(baslik);

  const yemekUl = el('ul', { className: 'yemek-listesi' });
  for (const y of menu.yemekler) {
    const etiketler = [];
    if (y.uyari_var && y.uyari_alerjenler && y.uyari_alerjenler.length > 0) {
      etiketler.push(
        el('span', {
          className: 'rozet rozet-tehlike',
          textContent: `ALERJEN UYARISI: ${y.uyari_alerjenler.join(', ')}`,
        })
      );
    }
    if (y.vejetaryen) {
      etiketler.push(el('span', { className: 'rozet rozet-veg', textContent: 'Vejetaryen' }));
    }
    if (y.alerjenler && y.alerjenler.length > 0) {
      etiketler.push(
        el('span', { className: 'rozet rozet-alerjen', textContent: `Alerjen: ${y.alerjenler.join(', ')}` })
      );
    }

    const satir = el('li', { className: y.uyari_var ? 'yemek-satir yemek-satir-uyari' : 'yemek-satir' }, [
      el('div', { className: 'yemek-ust' }, [
        el('span', {}, [
          el('strong', { textContent: y.ad }),
          ' ',
          el('span', { className: 'yemek-kategori', textContent: `(${y.kategori})` }),
        ]),
        el('span', { className: 'yemek-kalori', textContent: `${y.kalori} kcal` }),
      ]),
      etiketler.length > 0 ? el('div', { className: 'yemek-etiketler' }, etiketler) : null,
    ]);
    yemekUl.append(satir);
  }
  kart.append(yemekUl);

  if (rezervasyonGoster) {
    const alt = el('div', { className: 'menu-alt' });
    alt.append(
      el('span', {
        className: 'uyari-metin',
        textContent: `Son rezervasyon: ${menu.rezervasyon_son}`,
      })
    );

    const mevcutRez = menu.kullanici_rezervasyon;
    if (mevcutRez && (mevcutRez.durum === 'aktif' || mevcutRez.durum === 'kullanildi')) {
      const porsiyonBilgi = PORSIYON_ADLARI[mevcutRez.porsiyon] || 'Tam';
      alt.append(
        el('span', {
          className: `rozet rozet-${mevcutRez.durum}`,
          textContent: `Rezervasyon: ${REZ_DURUM_ADLARI[mevcutRez.durum]} (${porsiyonBilgi})`,
        })
      );
    } else {
      const pasif = menu.suresi_doldu || menu.bos_yer <= 0;
      const dugmeMetni = menu.suresi_doldu
        ? 'Süresi Doldu'
        : menu.bos_yer <= 0
          ? 'Kontenjan Dolu'
          : 'Rezervasyon Yap';

      let porsiyonSec = null;
      const islemAlani = el('div', { className: 'porsiyon-secim' });

      if (menu.yarim_porsiyon_destekli && !pasif) {
        porsiyonSec = el('select', { 'aria-label': 'Porsiyon seçimi' }, [
          el('option', {
            value: 'tam',
            textContent: `Tam Porsiyon (${paraBicimle(menu.kullanici_fiyati)})`,
          }),
          el('option', {
            value: 'yarim',
            textContent: `Yarım Porsiyon (${paraBicimle(menu.yarim_porsiyon_fiyati)})`,
          }),
        ]);
        islemAlani.append(porsiyonSec);
      }

      const rezDugme = el('button', {
        type: 'button',
        className: 'dugme dugme-kucuk',
        disabled: pasif,
        textContent: dugmeMetni,
        onClick: async () => {
          const secilenPorsiyon = porsiyonSec ? porsiyonSec.value : 'tam';
          await rezervasyonYapTiklandi(menu.menu_id, secilenPorsiyon, rezDugme);
        },
      });
      islemAlani.append(rezDugme);
      alt.append(islemAlani);
    }
    kart.append(alt);
  }

  return kart;
}

async function rezervasyonYapTiklandi(menuId, porsiyon, dugme) {
  mesajTemizle();
  dugme.disabled = true;
  try {
    const sonuc = await apiIstek('/rezervasyonlar', {
      method: 'POST',
      body: { menu_id: menuId, porsiyon },
    });
    bakiyeGuncelle(sonuc.bakiye);
    const porsiyonMetni = PORSIYON_ADLARI[sonuc.porsiyon] || 'Tam';
    mesajGoster(
      `Rezervasyon oluşturuldu (${porsiyonMetni}, ${paraBicimle(sonuc.ucret)}). Güncel bakiye: ${paraBicimle(sonuc.bakiye)}`
    );
    await kisaBekle(250);
    await gununMenusunuYukle();
    await haftalikMenuleriYukle();
  } catch (err) {
    mesajGoster(err.message, true);
    dugme.disabled = false;
  }
}

async function gununMenusunuYukle() {
  const tarih = document.getElementById('gunun-tarih').value || bugunMetni();
  const yemekhaneId = document.getElementById('gunun-yemekhane').value;
  const ogunId = document.getElementById('gunun-ogun').value;
  const alan = document.getElementById('gunun-icerik');

  const parametre = new URLSearchParams({ tarih });
  if (yemekhaneId) parametre.set('yemekhane_id', yemekhaneId);
  if (ogunId) parametre.set('ogun_id', ogunId);

  try {
    const veri = await apiIstek('/menuler/gunun?' + parametre.toString());
    alan.replaceChildren();
    if (veri.menuler.length === 0) {
      alan.append(el('div', { className: 'kart' }, [el('p', { textContent: 'Seçilen kriterler için menü bulunamadı.' })]));
      return;
    }
    for (const menu of veri.menuler) {
      alan.append(menuKartiOlustur(menu, true));
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function haftalikMenuleriYukle() {
  const baslangic = document.getElementById('haftalik-baslangic').value || bugunMetni();
  const yemekhaneId = document.getElementById('haftalik-yemekhane').value;
  const alan = document.getElementById('haftalik-icerik');

  const parametre = new URLSearchParams({ baslangic });
  if (yemekhaneId) parametre.set('yemekhane_id', yemekhaneId);

  try {
    const veri = await apiIstek('/menuler/haftalik?' + parametre.toString());
    alan.replaceChildren();
    if (veri.menuler.length === 0) {
      alan.append(el('div', { className: 'kart' }, [el('p', { textContent: 'Bu tarih aralığında menü bulunamadı.' })]));
      return;
    }
    for (const menu of veri.menuler) {
      alan.append(menuKartiOlustur(menu, true));
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function rezervasyonlariYukle() {
  const govde = document.getElementById('rezervasyon-govde');
  try {
    const veri = await apiIstek('/rezervasyonlarim');
    govde.replaceChildren();
    if (veri.rezervasyonlar.length === 0) {
      govde.append(
        el('tr', {}, [el('td', { colSpan: '6', textContent: 'Henüz rezervasyonunuz yok.' })])
      );
      return;
    }

    for (const rez of veri.rezervasyonlar) {
      const islemHucre = el('td');
      if (rez.iptal_edilebilir) {
        islemHucre.append(
          el('button', {
            type: 'button',
            className: 'dugme dugme-tehlike dugme-kucuk',
            textContent: 'İptal Et',
            onClick: async () => {
              mesajTemizle();
              try {
                const sonuc = await apiIstek(`/rezervasyonlar/${rez.rezervasyon_id}/iptal`, {
                  method: 'POST',
                });
                bakiyeGuncelle(sonuc.bakiye);
                mesajGoster(`Rezervasyon iptal edildi. İade: ${paraBicimle(sonuc.iade)}`);
                await kisaBekle(250);
                await rezervasyonlariYukle();
              } catch (err) {
                mesajGoster(err.message, true);
              }
            },
          })
        );
      } else {
        islemHucre.append(el('span', { className: 'uyari-metin', textContent: '—' }));
      }

      govde.append(
        el('tr', {}, [
          el('td', { textContent: rez.tarih }),
          el('td', { textContent: `${rez.yemekhane} · ${rez.ogun}` }),
          el('td', { textContent: PORSIYON_ADLARI[rez.porsiyon] || 'Tam' }),
          el('td', { textContent: paraBicimle(rez.ucret) }),
          el('td', {}, [
            el('span', {
              className: `rozet rozet-${rez.durum}`,
              textContent: REZ_DURUM_ADLARI[rez.durum] || rez.durum,
            }),
          ]),
          islemHucre,
        ])
      );
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function bakiyeyiYukle(kaynaktan = false) {
  const govde = document.getElementById('bakiye-govde');
  try {
    const veri = await apiIstek('/bakiye' + (kaynaktan ? '?kaynak=1' : ''));
    bakiyeGuncelle(veri.bakiye);
    govde.replaceChildren();
    if (veri.hareketler.length === 0) {
      govde.append(
        el('tr', {}, [el('td', { colSpan: '4', textContent: 'Henüz bakiye hareketi yok.' })])
      );
      return;
    }

    for (const h of veri.hareketler) {
      const artiMi = Number(h.tutar) > 0;
      govde.append(
        el('tr', {}, [
          el('td', { textContent: h.olusturma }),
          el('td', { textContent: HAREKET_TURLERI[h.tur] || h.tur }),
          el('td', {
            className: artiMi ? 'tutar-arti' : 'tutar-eksi',
            textContent: (artiMi ? '+' : '') + paraBicimle(h.tutar),
          }),
          el('td', { textContent: h.aciklama || '—' }),
        ])
      );
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function degerlendirmeleriYukle() {
  const alan = document.getElementById('degerlendirilecek-alan');
  const govde = document.getElementById('degerlendirme-govde');

  try {
    const [rezVeri, degVeri] = await Promise.all([
      apiIstek('/rezervasyonlarim'),
      apiIstek('/degerlendirmeler'),
    ]);

    const degerlendirilebilir = rezVeri.rezervasyonlar.filter(
      (r) => r.durum === 'kullanildi' && !r.degerlendirme_id
    );

    alan.replaceChildren();
    if (degerlendirilebilir.length === 0) {
      alan.append(
        el('div', { className: 'kart' }, [
          el('p', {
            className: 'uyari-metin',
            textContent: 'Değerlendirilmeyi bekleyen kullanılmış menünüz bulunmuyor.',
          }),
        ])
      );
    } else {
      for (const r of degerlendirilebilir) {
        const puanSec = el('select', {}, [
          el('option', { value: '5', textContent: '5 - Çok İyi' }),
          el('option', { value: '4', textContent: '4 - İyi' }),
          el('option', { value: '3', textContent: '3 - Orta' }),
          el('option', { value: '2', textContent: '2 - Zayıf' }),
          el('option', { value: '1', textContent: '1 - Kötü' }),
        ]);
        const yorumGirdi = el('input', {
          type: 'text',
          maxlength: '500',
          placeholder: 'Yorumunuz (isteğe bağlı)',
        });

        const form = el(
          'form',
          {
            className: 'kart',
            onSubmit: async (e) => {
              e.preventDefault();
              mesajTemizle();
              try {
                await apiIstek('/degerlendirmeler', {
                  method: 'POST',
                  body: {
                    menu_id: r.menu_id,
                    puan: Number(puanSec.value),
                    yorum: yorumGirdi.value,
                  },
                });
                mesajGoster('Değerlendirmeniz kaydedildi.');
                await kisaBekle(250);
                await degerlendirmeleriYukle();
              } catch (err) {
                mesajGoster(err.message, true);
              }
            },
          },
          [
            el('h3', { textContent: `${r.tarih} · ${r.yemekhane} (${r.ogun})` }),
            el('div', { className: 'puan-satir' }, [
              el('div', {}, [el('label', { textContent: 'Puan' }), puanSec]),
              el('div', {}, [el('label', { textContent: 'Yorum' }), yorumGirdi]),
              el('button', { type: 'submit', className: 'dugme', textContent: 'Gönder' }),
            ]),
          ]
        );
        alan.append(form);
      }
    }

    govde.replaceChildren();
    if (degVeri.degerlendirmeler.length === 0) {
      govde.append(
        el('tr', {}, [el('td', { colSpan: '4', textContent: 'Henüz değerlendirme yapmadınız.' })])
      );
    } else {
      for (const d of degVeri.degerlendirmeler) {
        govde.append(
          el('tr', {}, [
            el('td', { textContent: d.tarih }),
            el('td', { textContent: `${d.yemekhane} · ${d.ogun}` }),
            el('td', { textContent: `${d.puan} / 5` }),
            el('td', { textContent: d.yorum || '—' }),
          ])
        );
      }
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function profiliYukle() {
  const ozet = document.getElementById('profil-ozet');
  const listeEl = document.getElementById('profil-alerjen-listesi');
  const k = durum.kullanici;

  const bilgiSatirlari = [
    el('p', {}, [el('strong', { textContent: 'Ad Soyad: ' }), `${k.ad} ${k.soyad}`]),
    el('p', {}, [el('strong', { textContent: 'E-posta: ' }), k.eposta]),
    el('p', {}, [el('strong', { textContent: 'Rol: ' }), ROL_ADLARI[k.rol] || k.rol]),
  ];
  if (k.ogrenci_no) {
    bilgiSatirlari.push(el('p', {}, [el('strong', { textContent: 'Öğrenci No: ' }), k.ogrenci_no]));
  }
  ozet.replaceChildren(el('h3', { textContent: 'Hesap Bilgileri' }), ...bilgiSatirlari);

  try {
    const [alerjenVeri, seciliVeri] = await Promise.all([
      durum.tumAlerjenler.length > 0
        ? Promise.resolve({ alerjenler: durum.tumAlerjenler })
        : apiIstek('/alerjenler'),
      apiIstek('/profil/alerjenler?kaynak=1'),
    ]);

    durum.tumAlerjenler = alerjenVeri.alerjenler;
    durum.kullaniciAlerjenIdleri = seciliVeri.alerjen_idler;

    const seciliSet = new Set(durum.kullaniciAlerjenIdleri);
    listeEl.replaceChildren();
    for (const a of durum.tumAlerjenler) {
      const cb = el('input', {
        type: 'checkbox',
        value: a.id,
        checked: seciliSet.has(a.id),
      });
      listeEl.append(el('label', { className: 'yemek-secim-satir' }, [cb, a.ad]));
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

function yoneticiYemekSecimleriniCiz(seciliIdler = []) {
  const kutu = document.getElementById('ym-yemek-listesi');
  const seciliSet = new Set(seciliIdler.map(Number));
  kutu.replaceChildren();

  for (const y of durum.tumYemekler) {
    const cb = el('input', {
      type: 'checkbox',
      value: y.id,
      checked: seciliSet.has(y.id),
    });
    kutu.append(
      el('label', { className: 'yemek-secim-satir' }, [
        cb,
        `${y.kategori}: ${y.ad} (${y.kalori} kcal)`,
      ])
    );
  }
}

function yoneticiFormSifirla() {
  durum.duzenlenenMenuId = null;
  document.getElementById('yonetici-form-baslik').textContent = 'Yeni Menü Oluştur';
  document.getElementById('ym-kaydet-dugme').textContent = 'Menüyü Kaydet';
  document.getElementById('ym-iptal-dugme').classList.add('gizli');
  document.getElementById('ym-yemekhane').disabled = false;
  document.getElementById('ym-tarih').disabled = false;
  document.getElementById('ym-ogun').disabled = false;
  document.getElementById('ym-tarih').value = bugunMetni();
  document.getElementById('ym-ogr-fiyat').value = '';
  document.getElementById('ym-per-fiyat').value = '';
  yoneticiYemekSecimleriniCiz([]);
}

function yoneticiDuzenlemeyeAl(menu) {
  durum.duzenlenenMenuId = menu.menu_id;
  document.getElementById('yonetici-form-baslik').textContent = `Menüyü Düzenle (#${menu.menu_id})`;
  document.getElementById('ym-kaydet-dugme').textContent = 'Değişiklikleri Kaydet';
  document.getElementById('ym-iptal-dugme').classList.remove('gizli');
  document.getElementById('ym-yemekhane').value = menu.yemekhane_id;
  document.getElementById('ym-tarih').value = menu.tarih;
  document.getElementById('ym-ogun').value = menu.ogun_id;
  document.getElementById('ym-yemekhane').disabled = true;
  document.getElementById('ym-tarih').disabled = true;
  document.getElementById('ym-ogun').disabled = true;
  document.getElementById('ym-ogr-fiyat').value = menu.ogrenci_fiyati;
  document.getElementById('ym-per-fiyat').value = menu.personel_fiyati;
  yoneticiYemekSecimleriniCiz(menu.yemekler.map((y) => y.yemek_id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function yoneticiPaneliniYukle() {
  const govde = document.getElementById('yonetici-menu-govde');
  try {
    if (durum.tumYemekler.length === 0) {
      const yVeri = await apiIstek('/yonetici/yemekler');
      durum.tumYemekler = yVeri.yemekler;
      yoneticiYemekSecimleriniCiz([]);
    }

    const veri = await apiIstek('/yonetici/menuler');
    durum.yoneticiMenuler = veri.menuler;
    govde.replaceChildren();

    for (const m of veri.menuler) {
      const puanMetni = m.ortalama_puan !== null ? `${m.ortalama_puan} (${m.oy_sayisi} oy)` : 'Oy yok';
      govde.append(
        el('tr', {}, [
          el('td', { textContent: m.tarih }),
          el('td', { textContent: `${m.yemekhane} · ${m.ogun}` }),
          el('td', { textContent: `${m.rezerve}/${m.kapasite} (%${m.doluluk_yuzde})` }),
          el('td', { textContent: puanMetni }),
          el('td', {}, [
            el('button', {
              type: 'button',
              className: 'dugme dugme-ikincil dugme-kucuk',
              textContent: 'Düzenle',
              onClick: () => yoneticiDuzenlemeyeAl(m),
            }),
          ]),
        ])
      );
    }
  } catch (err) {
    mesajGoster(err.message, true);
  }
}

async function ekranAc(ekranAdi) {
  mesajTemizle();
  for (const dugme of document.querySelectorAll('.sekme-dugme')) {
    dugme.classList.toggle('aktif', dugme.dataset.ekran === ekranAdi);
  }
  for (const bolum of document.querySelectorAll('.ekran')) {
    bolum.classList.toggle('gizli', bolum.id !== `ekran-${ekranAdi}`);
  }

  if (ekranAdi === 'gunun') await gununMenusunuYukle();
  if (ekranAdi === 'haftalik') await haftalikMenuleriYukle();
  if (ekranAdi === 'rezervasyonlar') await rezervasyonlariYukle();
  if (ekranAdi === 'bakiye') await bakiyeyiYukle();
  if (ekranAdi === 'degerlendirme') await degerlendirmeleriYukle();
  if (ekranAdi === 'profil') await profiliYukle();
  if (ekranAdi === 'yonetici') await yoneticiPaneliniYukle();
}

async function uygulamaKabugunuBaslat(kullanici) {
  durum.kullanici = kullanici;
  document.getElementById('giris-ekrani').classList.add('gizli');
  document.getElementById('uygulama-ekrani').classList.remove('gizli');

  document.getElementById('ust-kullanici-ad').textContent = `${kullanici.ad} ${kullanici.soyad}`;
  document.getElementById('ust-kullanici-rol').textContent = ROL_ADLARI[kullanici.rol] || kullanici.rol;
  bakiyeGuncelle(kullanici.bakiye);

  const yoneticiSekme = document.getElementById('sekme-yonetici');
  yoneticiSekme.classList.toggle('gizli', kullanici.rol !== 'yonetici');

  const refVeri = await apiIstek('/referanslar');
  durum.yemekhaneler = refVeri.yemekhaneler;
  durum.ogunler = refVeri.ogunler;

  secenekleriDoldur(document.getElementById('gunun-yemekhane'), durum.yemekhaneler);
  secenekleriDoldur(document.getElementById('gunun-ogun'), durum.ogunler);
  secenekleriDoldur(document.getElementById('haftalik-yemekhane'), durum.yemekhaneler, 'Tüm Yemekhaneler');
  secenekleriDoldur(document.getElementById('ym-yemekhane'), durum.yemekhaneler);
  secenekleriDoldur(document.getElementById('ym-ogun'), durum.ogunler);

  const bugun = bugunMetni();
  document.getElementById('gunun-tarih').value = bugun;
  document.getElementById('haftalik-baslangic').value = bugun;
  document.getElementById('ym-tarih').value = bugun;

  if (durum.ogunler.length > 1) {
    document.getElementById('gunun-ogun').value = String(durum.ogunler[1].id);
  }

  await ekranAc('gunun');
}

function girisEkraniniGoster() {
  durum.kullanici = null;
  durum.tumYemekler = [];
  durum.tumAlerjenler = [];
  durum.kullaniciAlerjenIdleri = [];
  yoneticiFormSifirla();
  document.getElementById('uygulama-ekrani').classList.add('gizli');
  document.getElementById('giris-ekrani').classList.remove('gizli');
}

document.getElementById('giris-formu').addEventListener('submit', async (e) => {
  e.preventDefault();
  const hataKutu = document.getElementById('giris-hata');
  hataKutu.classList.add('gizli');

  try {
    const veri = await apiIstek('/giris', {
      method: 'POST',
      body: {
        eposta: document.getElementById('giris-eposta').value,
        sifre: document.getElementById('giris-sifre').value,
      },
    });
    document.getElementById('giris-sifre').value = '';
    await uygulamaKabugunuBaslat(veri.kullanici);
  } catch (err) {
    hataKutu.textContent = err.message;
    hataKutu.classList.remove('gizli');
  }
});

document.getElementById('cikis-dugme').addEventListener('click', async () => {
  try {
    await apiIstek('/cikis', { method: 'POST' });
  } catch {}
  girisEkraniniGoster();
});

for (const dugme of document.querySelectorAll('.sekme-dugme')) {
  dugme.addEventListener('click', () => {
    ekranAc(dugme.dataset.ekran);
  });
}

document.getElementById('gunun-tarih').addEventListener('change', gununMenusunuYukle);
document.getElementById('gunun-yemekhane').addEventListener('change', gununMenusunuYukle);
document.getElementById('gunun-ogun').addEventListener('change', gununMenusunuYukle);
document.getElementById('haftalik-yenile').addEventListener('click', haftalikMenuleriYukle);

for (const dugme of document.querySelectorAll('.hizli-tutar')) {
  dugme.addEventListener('click', () => {
    document.getElementById('bakiye-tutar').value = dugme.dataset.tutar;
  });
}

document.getElementById('bakiye-formu').addEventListener('submit', async (e) => {
  e.preventDefault();
  mesajTemizle();
  const tutarGirdi = document.getElementById('bakiye-tutar');
  try {
    const sonuc = await apiIstek('/bakiye/yukle', {
      method: 'POST',
      body: { tutar: tutarGirdi.value },
    });
    tutarGirdi.value = '';
    bakiyeGuncelle(sonuc.bakiye);
    mesajGoster(`Bakiye yüklendi. Güncel bakiye: ${paraBicimle(sonuc.bakiye)}`);
    await bakiyeyiYukle(true);
  } catch (err) {
    mesajGoster(err.message, true);
  }
});

document.getElementById('profil-alerjen-formu').addEventListener('submit', async (e) => {
  e.preventDefault();
  mesajTemizle();
  const seciliIdler = Array.from(
    document.querySelectorAll('#profil-alerjen-listesi input[type="checkbox"]:checked')
  ).map((cb) => Number(cb.value));

  try {
    const sonuc = await apiIstek('/profil/alerjenler', {
      method: 'PUT',
      body: { alerjen_idler: seciliIdler },
    });
    durum.kullaniciAlerjenIdleri = sonuc.alerjen_idler;
    mesajGoster(sonuc.mesaj);
    await kisaBekle(250);
  } catch (err) {
    mesajGoster(err.message, true);
  }
});

document.getElementById('ym-iptal-dugme').addEventListener('click', yoneticiFormSifirla);

document.getElementById('yonetici-menu-formu').addEventListener('submit', async (e) => {
  e.preventDefault();
  mesajTemizle();

  const seciliYemekler = Array.from(
    document.querySelectorAll('#ym-yemek-listesi input[type="checkbox"]:checked')
  ).map((cb) => Number(cb.value));

  try {
    if (durum.duzenlenenMenuId) {
      await apiIstek(`/yonetici/menuler/${durum.duzenlenenMenuId}`, {
        method: 'PUT',
        body: {
          ogrenci_fiyati: Number(document.getElementById('ym-ogr-fiyat').value),
          personel_fiyati: Number(document.getElementById('ym-per-fiyat').value),
          yemek_idleri: seciliYemekler,
        },
      });
      mesajGoster('Menü güncellendi.');
    } else {
      await apiIstek('/yonetici/menuler', {
        method: 'POST',
        body: {
          yemekhane_id: Number(document.getElementById('ym-yemekhane').value),
          tarih: document.getElementById('ym-tarih').value,
          ogun_id: Number(document.getElementById('ym-ogun').value),
          ogrenci_fiyati: Number(document.getElementById('ym-ogr-fiyat').value),
          personel_fiyati: Number(document.getElementById('ym-per-fiyat').value),
          yemek_idleri: seciliYemekler,
        },
      });
      mesajGoster('Yeni menü oluşturuldu.');
    }
    yoneticiFormSifirla();
    await kisaBekle(250);
    await yoneticiPaneliniYukle();
  } catch (err) {
    mesajGoster(err.message, true);
  }
});

(async function baslangicKontrol() {
  try {
    const veri = await apiIstek('/ben');
    await uygulamaKabugunuBaslat(veri.kullanici);
  } catch {
    girisEkraniniGoster();
  }
})();
