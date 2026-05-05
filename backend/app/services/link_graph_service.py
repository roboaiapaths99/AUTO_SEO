"""
AutoSEO AI Platform — Link Graph Service
========================================
Calculates internal link authority (PageRank) and builds graph structures
from real crawl data stored in MongoDB.
"""

from typing import List, Dict, Any, Set
import networkx as nx
import logging

logger = logging.getLogger(__name__)


class LinkGraphService:
    def __init__(self, audit_report: Dict[str, Any], pages: List[Dict[str, Any]] = None):
        self.report = audit_report
        self.pages = pages or []
        self.graph = nx.DiGraph()
        self.domain = audit_report.get("domain", "")

    def build_graph(self):
        """Builds a directed graph from real crawl data internal links."""
        if self.pages:
            self._build_from_crawl_data()
        else:
            self._build_from_audit_report()
        
        # If no edges were built, try to infer structure from page URLs
        if self.graph.number_of_edges() == 0 and self.graph.number_of_nodes() > 1:
            self._infer_hierarchy_links()

    def _build_from_crawl_data(self):
        """Build graph from real crawled page data with internal_links."""
        # Add all crawled pages as nodes
        for page in self.pages:
            url = page.get("url", "")
            if url:
                # Normalize to path for cleaner visualization
                path = self._normalize_url(url)
                self.graph.add_node(path, **{
                    "status_code": page.get("status_code", 200),
                    "title": page.get("title", ""),
                    "word_count": page.get("word_count", 0),
                })

        # Build edges from internal links
        for page in self.pages:
            source = self._normalize_url(page.get("url", ""))
            if not source:
                continue
            
            internal_links = page.get("internal_links", [])
            if isinstance(internal_links, list):
                for target_url in internal_links:
                    target = self._normalize_url(target_url)
                    # Only add edges to pages we've actually crawled
                    if target and target in self.graph:
                        self.graph.add_edge(source, target)
                    elif target and target != source:
                        # Add the target node even if not in crawl set
                        self.graph.add_node(target)
                        self.graph.add_edge(source, target)

    def _build_from_audit_report(self):
        """Build graph from audit report summary when raw pages aren't available."""
        # Extract whatever page data exists in the report
        top_issues = self.report.get("top_issues", [])
        discovered_urls = set()
        
        # Collect URLs from issues
        for issue in top_issues:
            url = issue.get("url", "")
            if url:
                path = self._normalize_url(url)
                if path:
                    discovered_urls.add(path)
        
        # Always include the homepage
        discovered_urls.add("/")
        
        # Add common paths based on domain structure
        page_stats = self.report.get("page_stats", {})
        total_pages = self.report.get("total_pages_crawled", 0) or page_stats.get("total_pages", 0)
        
        for url in discovered_urls:
            self.graph.add_node(url)

    def _infer_hierarchy_links(self):
        """Infer parent-child relationships from URL path structure."""
        nodes = list(self.graph.nodes)
        
        for node in nodes:
            if node == "/":
                continue
            
            # Find the parent path
            parts = node.rstrip("/").split("/")
            if len(parts) > 1:
                parent = "/".join(parts[:-1]) or "/"
                if parent in self.graph:
                    self.graph.add_edge(parent, node)
                else:
                    # Connect to homepage if parent doesn't exist
                    if "/" in self.graph:
                        self.graph.add_edge("/", node)
            elif "/" in self.graph:
                self.graph.add_edge("/", node)
        
        # Add return links to homepage from all pages
        for node in nodes:
            if node != "/" and "/" in self.graph:
                self.graph.add_edge(node, "/")

    def _normalize_url(self, url: str) -> str:
        """Normalize a URL to a relative path for consistent graph node IDs."""
        if not url:
            return ""
        
        url = url.strip()
        
        # Remove protocol and domain
        for prefix in [f"https://{self.domain}", f"http://{self.domain}", 
                       f"https://www.{self.domain}", f"http://www.{self.domain}"]:
            if url.startswith(prefix):
                url = url[len(prefix):]
                break
        
        # If it's still a full URL to another domain, skip it
        if url.startswith("http://") or url.startswith("https://"):
            return ""
        
        # Ensure starts with /
        if not url.startswith("/"):
            url = f"/{url}"
        
        # Remove trailing slash (except for root)
        if url != "/" and url.endswith("/"):
            url = url.rstrip("/")
        
        # Remove query params and fragments for cleaner graph
        url = url.split("?")[0].split("#")[0]
        
        return url or "/"

    def calculate_pagerank(self) -> Dict[str, float]:
        """Calculates PageRank (Link Juice) for every page."""
        if not self.graph.nodes:
            return {}
        try:
            return nx.pagerank(self.graph, weight='weight')
        except Exception:
            # Fallback if graph is disconnected or has issues
            node_count = len(self.graph.nodes)
            return {node: 1.0 / node_count for node in self.graph.nodes} if node_count else {}

    def get_graph_data(self) -> Dict[str, Any]:
        """Returns nodes and edges for frontend visualization."""
        self.build_graph()
        ranks = self.calculate_pagerank()
        
        nodes = []
        for node in self.graph.nodes:
            node_data = self.graph.nodes[node]
            nodes.append({
                "id": node,
                "label": node,
                "val": (ranks.get(node, 0) * 100) + 5,
                "authority": round(ranks.get(node, 0) * 100, 2),
                "in_links": self.graph.in_degree(node),
                "out_links": self.graph.out_degree(node),
                "title": node_data.get("title", ""),
                "status_code": node_data.get("status_code", 200),
            })
            
        links = []
        for u, v in self.graph.edges:
            links.append({"source": u, "target": v})
        
        # Sort nodes by authority for insights
        sorted_nodes = sorted(nodes, key=lambda x: x["authority"], reverse=True)
        
        # Identify orphan pages (no incoming links except possibly from homepage)
        orphan_pages = [n["id"] for n in nodes if n["in_links"] == 0 and n["id"] != "/"]
        
        # Identify pages with too many outgoing links (link dilution)
        diluted_pages = [n["id"] for n in nodes if n["out_links"] > 50]
            
        return {
            "nodes": nodes,
            "links": links,
            "stats": {
                "total_pages": len(nodes),
                "total_links": len(links),
                "avg_authority": round(sum(ranks.values()) / len(ranks) if ranks else 0, 4),
                "top_authority_pages": [{"url": n["id"], "authority": n["authority"]} for n in sorted_nodes[:5]],
                "orphan_pages": orphan_pages[:10],
                "diluted_pages": diluted_pages[:5],
            }
        }
