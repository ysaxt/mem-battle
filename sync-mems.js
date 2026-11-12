
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const folder = path.join(__dirname, 'mems');
const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function main() {
  if (!fs.existsSync(folder)) {
    console.log('Папка mems не найдена');
    return;
  }

  const files = fs.readdirSync(folder, { withFileTypes: true })
    .filter(file => file.isFile())
    .map(file => file.name)
    .filter(name => allowed.includes(path.extname(name).toLowerCase()));

  console.log('Найдено изображений:', files.length);

  for (const filename of files) {
    const imageUrl =
      'https://raw.githubusercontent.com/' +
      'ysaxt/mem-battle/main/mems/' +
      filename.split('/').map(encodeURIComponent).join('/');

    const { data: existing, error: checkError } = await supabase
      .from('memes')
      .select('id')
      .eq('image_url', imageUrl)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      console.log('Уже есть:', filename);
      continue;
    }

    const { error: insertError } = await supabase
      .from('memes')
      .insert({
        image_url: imageUrl,
        wins: 0
      });

    if (insertError) {
      throw insertError;
    }

    console.log('Добавлен:', filename);
  }

  console.log('Синхронизация завершена!');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
