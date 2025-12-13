// Test ImgBB API
import FormData from 'form-data';

const IMGBB_API_KEY = '2790626512f8556a4df151f5c0a4acc0';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

async function testImgBB() {
  console.log('🧪 Testing ImgBB API...');
  console.log('API Key:', IMGBB_API_KEY.substring(0, 10) + '...');
  console.log('API URL:', IMGBB_API_URL);
  
  try {
    // Create a small test image (1x1 pixel PNG) - base64 encoded
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    // ImgBB accepts file uploads via FormData
    const testImageBuffer = Buffer.from(testImageBase64, 'base64');
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    const headers = formData.getHeaders ? formData.getHeaders() : {};
    
    console.log('📤 Sending request to ImgBB...');
    const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      headers: headers
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    const result = await response.json();
    
    if (result.success && result.data?.url) {
      console.log('✅ ImgBB API is WORKING!');
      console.log('📸 Test image uploaded successfully:');
      console.log('   URL:', result.data.url);
      console.log('   Display URL:', result.data.display_url);
      return true;
    } else {
      console.error('❌ ImgBB API test FAILED');
      console.error('Response:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ ImgBB API test ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testImgBB().then(success => {
  process.exit(success ? 0 : 1);
});

