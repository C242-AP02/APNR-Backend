import axios from 'axios';
import FormData from 'form-data';

export const ML_URL = 'https://apnr-ml-580245180821.asia-southeast2.run.app/predict';

export async function predictImage(image) {
  try {
    const form = new FormData();
    form.append('file', image, {
      filename: 'image.jpg',
      contentType: 'image/jpeg',
    });

    const response = await axios.post( ML_URL, form, {
        headers: {
          ...form.getHeaders(),
        },
    });

    const { plates } = response.data;

    if (!plates || plates.length === 0) {
      throw new Error('No plate detected');
    }

    return plates;

  } catch (error) {

    if (error.message === 'No plate detected') {
      throw new Error('No plate detected');
    }
    throw error;
  }
}
