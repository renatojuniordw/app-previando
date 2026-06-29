declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: { [sheet: string]: WorkSheet }
  }
  export interface WorkSheet {
    [cell: string]: any
  }
  export function read(data: any, opts?: any): WorkBook
  export const SSF: any
  export const utils: {
    sheet_to_json<T = any>(sheet: WorkSheet, opts?: any): T[]
    json_to_sheet<T = any>(data: T[], opts?: any): WorkSheet
    book_new(): WorkBook
    book_append_sheet(book: WorkBook, sheet: WorkSheet, name?: string): void
  }
  export const version: string
}
