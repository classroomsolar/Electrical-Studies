import {manufacturerRecords as originalRecords} from './manufacturer-data.mjs?v=20261022-pv-final';
import {expandedManufacturerRecords} from './manufacturer-expanded-data.mjs?v=20261022-pv-final';
export const manufacturerRecords=[...originalRecords,...expandedManufacturerRecords];
