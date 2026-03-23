import { useState, useEffect } from "react";
import { getLanguagePairs } from "../lib/api";

export function useLanguagePairs() {
  const [sources, setSources] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLanguagePairs()
      .then(({ sources, targets, labels }) => {
        setSources(sources);
        setTargets(targets);
        setLabels(labels);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { sources, targets, labels, loading };
}
