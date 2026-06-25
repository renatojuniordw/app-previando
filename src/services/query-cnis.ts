import { prisma } from '../lib/prisma'
async function run() {
  const doc = await prisma.cnisDocument.findUnique({
    where: { id: 'cmqu398hs000burdynntg8elh' },
    include: { case: true }
  })
  console.log('Document Status:', doc?.processingStatus)
  console.log('Document Case ID:', doc?.caseId)
  console.log('Case User ID:', doc?.case?.userId)
  console.log('Extracted Data:', JSON.stringify(doc?.extractedData, null, 2))
  console.log('Markdown Content Length:', doc?.markdownContent?.length)
}
run()
