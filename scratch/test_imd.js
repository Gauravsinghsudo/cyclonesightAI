async function testBulletinsProducts() {
  try {
    const res = await fetch('https://rsmcnewdelhi.imd.gov.in/bulletins-products.php', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log('bulletins-products status:', res.status);
    const html = await res.text();
    const links = [...html.matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    console.log('Bulletin Links:', links.filter(l => l.includes('uploads/') || l.includes('Bulletin') || l.includes('Outlook') || l.includes('txt') || l.includes('pdf')));
  } catch (e) {
    console.error(e);
  }
}

testBulletinsProducts();
