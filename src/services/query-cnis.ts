import { prisma } from '../lib/prisma'
async function run() {
  const doc = await prisma.cnisDocument.findUnique({
    where: { id: 'cmqu398hs000burdynntg8elh' },
    include: { client: true }
  })
  console.log('Document Status:', doc?.processingStatus)
  console.log('Document Client ID:', doc?.clientId)
  console.log('Client User ID:', doc?.client?.userId)
  console.log('Extracted Data:', JSON.stringify(doc?.extractedData, null, 2))
  console.log('Markdown Content Length:', doc?.markdownContent?.length)
}
run()
