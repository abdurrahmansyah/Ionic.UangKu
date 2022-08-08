import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { TambahEditKategoriComponent } from '../components/tambah-edit-kategori/tambah-edit-kategori.component';
import { TambahEditTransaksiComponent } from '../components/tambah-edit-transaksi/tambah-edit-transaksi.component';
import { GlobalService, KategoriData, TransaksiData, TransaksiDataInDay, TransaksiDataInMonth } from '../services/global.service';
import { Storage } from '@capacitor/storage';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  // Index Page
  public folder: string;
  public isPageHome: boolean = false;
  public isPageKategori: boolean = false;
  public isPageRiwayatTransaksi: boolean = false;
  public isPageLaporanBulanan: boolean = false;
  public isPageTentang: boolean = false;

  // Transaksi Data
  public transaksiDataList: TransaksiData[] = this.globalService.transaksiDataList;
  public kategoriDataList: KategoriData[] = this.globalService.kategoriDataList;

  //Page Home
  public todayTransaksiDataList: TransaksiData[] = this.globalService.todayTransaksiDataList;

  // Text Page Home
  public txtDayNow: string;
  public txtBalance: string;

  // Page Laporan
  public laporanTransaksiDataList: TransaksiData[] = [];
  public laporanTransaksiDataListInMonth: TransaksiDataInMonth[] = this.globalService.laporanTransaksiDataListInMonth;
  public laporanTransaksiDataListInDay: TransaksiDataInDay[] = [];
  public filterBulanTahun: any = '';
  public bulanTahunList: any;

  constructor(private activatedRoute: ActivatedRoute,
    private globalService: GlobalService,
    private modalController: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertController: AlertController,
    private router: Router) {
    this.InitializeData();
    this.Timer();
  }

  async InitializeData() {
    this.ShowTransaksiDataList();
    this.ShowLaporanTransaksiDataListForFirstTime();
  }

  private Timer() {
    setInterval(function () {
      this.ShowRepeatData();
    }.bind(this), 500);
  }

  ShowRepeatData() {
    this.DeclareDateNow();
    this.DeclareBalance();
  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');
    this.isPageHome = this.folder == this.globalService.IndexPageData.Home ? true : false;
    this.isPageKategori = this.folder == this.globalService.IndexPageData.MenuKategori ? true : false;
    this.isPageRiwayatTransaksi = this.folder == this.globalService.IndexPageData.RiwayatTransaksi ? true : false;
    this.isPageLaporanBulanan = this.folder == this.globalService.IndexPageData.LaporanBulanan ? true : false;
    this.isPageTentang = this.folder == this.globalService.IndexPageData.Tentang ? true : false;
  }

  //#region Home

  private DeclareDateNow() {
    var dateData = this.globalService.GetDate();
    this.txtDayNow = dateData.szDay + ", " + dateData.decDate + " " + dateData.szMonth + " " + dateData.decYear;
  }

  private DeclareBalance() {
    var totalPemasukan = this.globalService.transaksiDataList
      .filter(y => y.jenisKategori == this.globalService.jenisKategoriData.pemasukan)
      .reduce((sum, current) => sum + +current.nominal, 0);

    var totalPengeluaran = this.globalService.transaksiDataList
      .filter(y => y.jenisKategori == this.globalService.jenisKategoriData.pengeluaran)
      .reduce((sum, current) => sum + +current.nominal, 0);

    var numb = totalPemasukan - totalPengeluaran;
    var format = numb.toString().split('').reverse().join('');
    var convert = format.match(/\d{1,3}/g);
    this.txtBalance = 'Rp ' + convert.join('.').split('').reverse().join('');
  }

  private ShowTransaksiDataList() {
    this.transaksiDataList = this.transaksiDataList.sort((a, b) => {
      return b.tanggal - a.tanggal;
    })

    this.todayTransaksiDataList = this.globalService.todayTransaksiDataList.sort((a, b) => {
      return b.tanggal - a.tanggal;
    })

    // this.transaksiDataList.forEach(transaksiData => {
    //   var format = transaksiData.nominal.toString().split('').reverse().join('');
    //   var convert = format.match(/\d{1,3}/g);
    //   transaksiData.nominalString = 'Rp ' + convert.join('.').split('').reverse().join('');
    // })
  }

  public async TambahTransaksi() {
    const modal = await this.modalController.create({
      component: TambahEditTransaksiComponent,
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.8, 0.95],
      mode: 'md',
      cssClass: 'round-modal',
      componentProps: {
        'aksiTransaksi': 'tambah'
      }
    });
    modal.onDidDismiss().then((modelData) => {
      if (modelData.role == "confirm") {
        if (modelData.data.dataPassing == "BerhasilCreate") {
          this.globalService.PresentToast('Berhasil menambah satu transaksi');
          this.ShowTransaksiDataList();
          this.ShowLaporanTransaksiDataList();
        }
      }
    })

    return await modal.present();
  }

  public async EditTransaksi(transaksiData) {
    const modal = await this.modalController.create({
      component: TambahEditTransaksiComponent,
      initialBreakpoint: 0.8,
      breakpoints: [0, 0.8, 0.95],
      mode: 'md',
      cssClass: 'round-modal',
      componentProps: {
        'aksiTransaksi': 'edit',
        'transaksiData': transaksiData
      }
    });
    modal.onDidDismiss().then((modelData) => {
      if (modelData.role == "confirm") {
        if (modelData.data.dataPassing == "BerhasilCreate") {
          this.globalService.PresentToast('Berhasil menambah satu transaksi');
          // console.log(this.globalService.transaksiDataList);
          this.globalService.LoadAndReloadAllTransaksiDataList();
          this.ShowTransaksiDataList();
          this.ShowLaporanTransaksiDataList();
        } else if (modelData.data.dataPassing == "BerhasilEditAtauHapus") {
          this.globalService.PresentToast('Berhasil merubah satu transaksi');
          // console.log(this.globalService.transaksiDataList);
          this.globalService.LoadAndReloadAllTransaksiDataList();
          this.ShowTransaksiDataList();
          this.ShowLaporanTransaksiDataList();
        }
      }
    })

    return await modal.present();
  }

  public LihatLaporanTransaksi() {
    this.router.navigateByUrl('/folder/Laporan Bulanan', { replaceUrl: true });
  }

  //#endregion

  //#region Menu Kategori

  ShowKategoriDataList() {

  }

  public async TambahKategori() {
    const modal = await this.modalController.create({
      component: TambahEditKategoriComponent,
      initialBreakpoint: 0.4,
      breakpoints: [0, 0.4, 0.6],
      mode: 'md',
      cssClass: 'round-modal',
      componentProps: {
        'aksiKategori': 'tambah'
      }
    });
    modal.onDidDismiss().then((modelData) => {
      if (modelData.role == "confirm") {
        if (modelData.data.dataPassing == "BerhasilCreate") {
          this.globalService.PresentToast('Berhasil menambah satu kategori');
          console.log(this.globalService.kategoriDataList);
        } else if (modelData.data.dataPassing == "BerhasilEdit") {
          this.globalService.PresentToast('Berhasil merubah satu kategori');
          console.log(this.globalService.kategoriDataList);
        }
      }
    })

    return await modal.present();
  }

  public async EditKategori(kategoriData) {
    const modal = await this.modalController.create({
      component: TambahEditKategoriComponent,
      initialBreakpoint: 0.4,
      breakpoints: [0, 0.4, 0.6],
      mode: 'md',
      cssClass: 'round-modal',
      componentProps: {
        'aksiKategori': 'edit',
        'kategoriData': kategoriData
      }
    });
    modal.onDidDismiss().then((modelData) => {
      if (modelData.role == "confirm") {
        if (modelData.data.dataPassing == "BerhasilCreate") {
          this.globalService.PresentToast('Berhasil menambah satu kategori');
          console.log(this.globalService.kategoriDataList);
        } else if (modelData.data.dataPassing == "BerhasilEdit") {
          this.globalService.PresentToast('Berhasil merubah satu kategori');
          console.log(this.globalService.kategoriDataList);
        }
      }
    })

    return await modal.present();
  }

  public async HapusKategori(kategoriData: KategoriData) {
    var isAnyTransaksi = this.globalService.transaksiDataList.filter(x => { return x.kategori == kategoriData.namaKategori && x.jenisKategori == kategoriData.jenisKategori }).length;

    if (isAnyTransaksi > 0) {
      this.alertController.create({
        mode: 'ios',
        message: 'Tidak dapat menghapus data kategori! Terdapat transaksi yang menggunakan kategori ini.',
        buttons: [{
          text: 'OK',
          role: 'Cancel'
        }]
      }).then(alert => {
        return alert.present();
      });
    } else {
      this.alertController.create({
        mode: 'ios',
        message: 'Apakah Anda Yakin Ingin Menghapus Data Kategori Ini ?',
        // cssClass: 'alert-akun',
        buttons: [{
          text: 'YES',
          handler: async () => {
            console.log(kategoriData);

            const index = this.globalService.kategoriDataList.findIndex(kategori =>
              kategori.jenisKategori.toUpperCase() == kategoriData.jenisKategori.toUpperCase() &&
              kategori.namaKategori.toUpperCase() == kategoriData.namaKategori.toUpperCase());
            console.log(index);

            this.globalService.kategoriDataList.splice(index, 1);

            await Storage.set({ key: 'kategoriDataList', value: JSON.stringify(this.globalService.kategoriDataList) });
            this.globalService.PresentToast('Berhasil mengahpus satu kategori');
            console.log(this.globalService.kategoriDataList);
          }
        }, {
          text: 'CANCEL',
          role: 'Cancel'
        }]
      }).then(alert => {
        return alert.present();
      });
    }
  }

  //#endregion

  //#region Laporan Bulanan

  public FilterChanged() {
    console.log(this.filterBulanTahun);

    this.ShowLaporanTransaksiDataList();
  }

  private ShowLaporanTransaksiDataListForFirstTime() {
    if (this.globalService.laporanTransaksiDataListInMonth.find(x => x))
      this.filterBulanTahun = this.globalService.laporanTransaksiDataListInMonth.find(x => x.filterBulanTahun).filterBulanTahun;

    this.ShowLaporanTransaksiDataList();
  }

  private ShowLaporanTransaksiDataList() {
    // this.laporanTransaksiDataList = this.transaksiDataList.sort((a, b) => {
    //   return b.tanggal - a.tanggal;
    // })

    var laporanTransaksiDataListCurrentMonth = this.laporanTransaksiDataListInMonth.filter(x => { return x.filterBulanTahun == this.filterBulanTahun });

    if (laporanTransaksiDataListCurrentMonth.find(x => x))
      this.laporanTransaksiDataListInDay = laporanTransaksiDataListCurrentMonth.find(x => x.transaksiDataListInDay).transaksiDataListInDay;

    // this.laporanTransaksiDataList 


    this.laporanTransaksiDataListInDay.forEach(x => {
      x.transaksiDataList
    });
    // this.transaksiDataList.forEach(transaksiData => {
    //   var format = transaksiData.nominal.toString().split('').reverse().join('');
    //   var convert = format.match(/\d{1,3}/g);
    //   transaksiData.nominalString = 'Rp ' + convert.join('.').split('').reverse().join('');
    // })
  }

  //#endregion

  //#region Page Tentang

  public HapusSemuaData() {
    this.alertController.create({
      mode: 'ios',
      message: 'Apakah Anda Yakin Ingin Menghapus Seluruh Data ?',
      // cssClass: 'alert-akun',
      buttons: [{
        text: 'YES',
        handler: () => {
          Storage.remove({ key: "kategoriDataList" });
          Storage.remove({ key: "transaksiDataList" });
          this.globalService.PresentToast('Berhasil Menghapus Seluruh Data');
        }
      }, {
        text: 'CANCEL',
        role: 'Cancel'
      }]
    }).then(alert => {
      return alert.present();
    });
  }

  //#endregion
}
