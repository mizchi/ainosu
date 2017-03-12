/* @flow */
import test from 'ava'
import lf from 'lovefield'
type Item = {
  title: string,
  body: string,
  createdAt: number,
  updatedAt: number
}

test('index', async t => {
  const lf = require('lovefield')
  const schema = require('./testschema')
  const schemaBuilder = lf.schema.create(schema.name, schema.version)
  const {loadSchema, Store} = require('../index')
  loadSchema(schema, schemaBuilder)

  class ItemStore extends Store<Item> {
    constructor (db: any) {
      super(db, 'Item')
    }
  }
  const db = await schemaBuilder.connect({storeType: lf.schema.DataStoreType.MEMORY})
  const itemStore = new ItemStore(db)
  const now = Date.now()
  const id = await itemStore.insert({
    title: 'aaaa',
    body: '.------.-.-.--.-',
    createdAt: now,
    updatedAt: now
  })

  const items = await itemStore.all()
  t.deepEqual(items, [{
    title: 'aaaa',
    body: '.------.-.-.--.-',
    createdAt: now,
    updatedAt: now,
    id
  }])
})
