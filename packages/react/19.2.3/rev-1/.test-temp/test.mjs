
try {
  const test = await import('@depup/react');
  console.log('✅ Import successful:', typeof test);
  console.log('✅ Default export:', typeof test.default);
  if (test.default && typeof test.default === 'object') {
    console.log('✅ Exports:', Object.keys(test.default).slice(0, 5).join(', '));
  }
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}
