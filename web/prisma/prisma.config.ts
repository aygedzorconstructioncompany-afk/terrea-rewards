import path from 'path'

const config = {
  schema: path.join(__dirname, 'schema.prisma'),
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
}

export default config