/* eslint-disable */
import type {Table, Database} from 'lovefield'
import lf from 'lovefield'

export class Store<T> {
  _db: any;
  _table: any;

  constructor (db: Database, tableName: string) {
    this._db = db
    this._table = this._db.getSchema().table(tableName)
  }

  getTable (): Table {
    return this._table
  }

  all (): Promise<T[]> {
    return this._db
      .select()
      .from(this._table)
      .exec()
  }

  where (op: any): Promise<T[]> {
    return this._db
      .select()
      .from(this._table)
      .where(op)
      .exec()
  }

  findBy (prop: $Keys<T>, value: any): Promise<T[]> {
    return this._db
      .select()
      .from(this._table)
      .where(this._table[prop].eq(value))
      .exec()
  }

  async find (value: number): Promise<T> {
    const id: any = 'id'
    const items = await this.findBy(id, value)
    return items[0]
  }

  async insert (t) {
    const isArray = t instanceof Array
    const ret = await this._db.insert().into(this._table).values(
      isArray ? t.map(i => this._table.createRow(i)) : [this._table.createRow(t)]
    ).exec()
    return isArray ? ret.map(i => i.id) : ret[0].id
  }

  async update (t) {
    const isArray = t instanceof Array
    const ret = await this._db.insertOrReplace().into(this._table).values(
      isArray ? t.map(i => this._table.createRow(i)) : [this._table.createRow(t)]
    ).exec()
    return isArray ? ret : ret[0]
  }

  delete (value: number): Promise<void> {
    return this._db.delete().from(this._table).where(this._table.id.eq(value)).exec()
  }

  deleteWhere (op: any): Promise<void> {
    return this._db.delete().from(this._table).where(op).exec()
  }
}

const lovefieldTypeMap = {
  string: lf.Type.STRING,
  number: lf.Type.NUMBER,
  integer: lf.Type.INTEGER,
  boolean: lf.Type.BOOLEAN,
  arraybuffer: lf.Type.ARRAY_BUFFER,
  datetime: lf.Type.DATE_TIME,
  object: lf.Type.OBJECT
}

export function loadSchema (schema: any, schemaBuilder: any) {
  for (const tableName in schema.table) {
    const builder = schemaBuilder.createTable(tableName)
    const table = schema.table[tableName]

    // column
    if (!table.properties.id) {
      table.properties.id = 'integer'
    }

    const nullables = []
    for (const propertyName in table.properties) {
      let correctName: ?string
      if (propertyName[0] === '?') {
        correctName = propertyName.substr(1)
        nullables.push(correctName)
      } else {
        correctName = propertyName
      }
      const type = lovefieldTypeMap[table.properties[correctName]]
      builder.addColumn(correctName, type)
    }

    // Add nullables by ?Type
    if (nullables.length) {
      builder.addNullable(nullables)
    }

    // primaryKey
    if (table.primary) {
      builder.addPrimaryKey([table.primary.name], !!table.primary.autoIncrement)
    } else {
      builder.addPrimaryKey(['id'], true)
    }

    // uniq
    if (table.unique) {
      for (const uqName of table.unique) {
        builder.addUnique(`unique_${uqName}`, [uqName])
      }
    }

    // index
    if (table.index) {
      for (const idxName in table.index) {
        const v = table.index[idxName]
        builder.addIndex(
          `index_${idxName}`,
          [idxName],
          !!v.unique,
          v.order ? lf.Order.DESC : lf.Order.ASC
        )
      }
    }
  }
}
