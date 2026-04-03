const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const BUCKET = 'sdc-study-materials';

// GET /materials - list materials with optional filters
router.get('/', async (req, res) => {
  const { batch_id, subject, chapter } = req.query;
  
  try {
    let query = 'SELECT * FROM study_materials WHERE 1=1';
    const params = [];
    
    if (batch_id) {
      params.push(batch_id);
      query += ` AND batch_id = $${params.length}`;
    }
    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }
    if (chapter) {
      params.push(chapter);
      query += ` AND chapter = $${params.length}`;
    }
    
    query += ' ORDER BY uploaded_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Materials fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// GET /materials/:id/download - get signed URL
router.get('/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM study_materials WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const material = result.rows[0];
    const file = storage.bucket(BUCKET).file(material.gcs_path);
    
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    res.json({ url: signedUrl, title: material.title });
  } catch (err) {
    console.error('Signed URL error:', err.message);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});