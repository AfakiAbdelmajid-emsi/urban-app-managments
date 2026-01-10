export class CreateAlertDto {
  type!: string;
  description?: string;
  latitude!: number;
  longitude!: number;
  photo?: string;
  roadName?: string;
  fullAddress?: string;
}
