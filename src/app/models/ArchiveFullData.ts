export default class ArchiveData{
    Room: string | undefined;
    Link: string | undefined;
    Nick: string | undefined;
    Hidden: boolean = false;
    Pass: boolean = false;
    Tags: string | undefined;
    StreamLink: string | undefined;
    ExtShare: boolean  = false;
    Star: number = 0;
    Note: string | undefined;
    Downloadable: boolean = false;
    AuxLink: string[] = [];
  }
  