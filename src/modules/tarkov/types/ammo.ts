/** A Tarkov ammo round as stored locally */
export interface TarkovAmmo {
  id: string;
  name: string;
  shortName: string;
  iconLink: string;
  caliber: string;
  damage: number;
  penetrationPower: number;
  armorDamage: number;
  fragmentationChance: number;
  ricochetChance: number;
  initialSpeed: number;
  tracer: boolean;
}
