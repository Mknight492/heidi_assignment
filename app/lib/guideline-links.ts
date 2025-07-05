import pdfToLinkMaps from '../api/mapping/pdf-to-link-maps.json';

export interface GuidelineLink {
  url: string;
  topic: string;
  subtopic: string;
  section: string | null;
}

/**
 * Maps a guideline source filename to its corresponding URL and metadata
 * @param source The source filename (e.g., "Dermatology-Balanoposthitis.md" or "Dermatology-Balanoposthitis.pdf")
 * @returns GuidelineLink object with URL and metadata, or null if not found
 */
export function getGuidelineLink(source: string): GuidelineLink | null {
  // Convert .md to .pdf for lookup since the mapping contains .pdf files
  const pdfSource = source.replace(/\.md$/i, '.pdf');
  
  // Try exact match with .pdf extension first
  if (pdfSource in pdfToLinkMaps) {
    const mapping = pdfToLinkMaps[pdfSource as keyof typeof pdfToLinkMaps];
    return {
      url: mapping.url,
      topic: mapping.topic,
      subtopic: mapping.subtopic,
      section: mapping.section
    };
  }

  // Try original source (in case it's already .pdf)
  if (source in pdfToLinkMaps) {
    const mapping = pdfToLinkMaps[source as keyof typeof pdfToLinkMaps];
    return {
      url: mapping.url,
      topic: mapping.topic,
      subtopic: mapping.subtopic,
      section: mapping.section
    };
  }

  // Try to find a partial match by removing file extensions and normalizing
  const normalizedSource = source.replace(/\.(pdf|md|json)$/i, '');
  
  for (const [filename, mapping] of Object.entries(pdfToLinkMaps)) {
    const normalizedFilename = filename.replace(/\.pdf$/i, '');
    
    if (normalizedFilename === normalizedSource) {
      return {
        url: mapping.url,
        topic: mapping.topic,
        subtopic: mapping.subtopic,
        section: mapping.section
      };
    }
  }

  // Try to find a match by topic/subtopic if the source contains relevant keywords
  const sourceLower = source.toLowerCase();
  
  for (const [filename, mapping] of Object.entries(pdfToLinkMaps)) {
    const topicLower = mapping.topic.toLowerCase();
    const subtopicLower = mapping.subtopic.toLowerCase();
    
    // Check if source contains topic or subtopic keywords
    if (sourceLower.includes(topicLower) || sourceLower.includes(subtopicLower)) {
      return {
        url: mapping.url,
        topic: mapping.topic,
        subtopic: mapping.subtopic,
        section: mapping.section
      };
    }
  }

  return null;
}

/**
 * Gets all available guideline links for a given topic
 * @param topic The topic to search for (e.g., "Dermatology", "Diabetes")
 * @returns Array of GuidelineLink objects for that topic
 */
export function getGuidelineLinksByTopic(topic: string): GuidelineLink[] {
  const links: GuidelineLink[] = [];
  const topicLower = topic.toLowerCase();
  
  for (const [filename, mapping] of Object.entries(pdfToLinkMaps)) {
    if (mapping.topic.toLowerCase().includes(topicLower) || 
        topicLower.includes(mapping.topic.toLowerCase())) {
      links.push({
        url: mapping.url,
        topic: mapping.topic,
        subtopic: mapping.subtopic,
        section: mapping.section
      });
    }
  }
  
  return links;
}

/**
 * Gets all available guideline links for a given subtopic
 * @param subtopic The subtopic to search for (e.g., "Balanoposthitis", "Acne")
 * @returns Array of GuidelineLink objects for that subtopic
 */
export function getGuidelineLinksBySubtopic(subtopic: string): GuidelineLink[] {
  const links: GuidelineLink[] = [];
  const subtopicLower = subtopic.toLowerCase();
  
  for (const [filename, mapping] of Object.entries(pdfToLinkMaps)) {
    if (mapping.subtopic.toLowerCase().includes(subtopicLower) || 
        subtopicLower.includes(mapping.subtopic.toLowerCase())) {
      links.push({
        url: mapping.url,
        topic: mapping.topic,
        subtopic: mapping.subtopic,
        section: mapping.section
      });
    }
  }
  
  return links;
}

/**
 * Gets all available guideline topics
 * @returns Array of unique topic names
 */
export function getAllGuidelineTopics(): string[] {
  const topics = new Set<string>();
  
  for (const mapping of Object.values(pdfToLinkMaps)) {
    topics.add(mapping.topic);
  }
  
  return Array.from(topics).sort();
}

/**
 * Gets all available guideline subtopics for a given topic
 * @param topic The topic to get subtopics for
 * @returns Array of unique subtopic names
 */
export function getGuidelineSubtopics(topic: string): string[] {
  const subtopics = new Set<string>();
  const topicLower = topic.toLowerCase();
  
  for (const mapping of Object.values(pdfToLinkMaps)) {
    if (mapping.topic.toLowerCase().includes(topicLower) || 
        topicLower.includes(mapping.topic.toLowerCase())) {
      subtopics.add(mapping.subtopic);
    }
  }
  
  return Array.from(subtopics).sort();
} 