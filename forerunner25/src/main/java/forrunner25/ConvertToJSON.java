package forrunner25;

import oracle.xml.parser.v2.DOMParser;
import oracle.xml.parser.v2.XMLDocument;
import oracle.xml.parser.v2.XMLElement;
import oracle.xml.parser.v2.XMLText;
import org.json.JSONObject;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.File;

public class ConvertToJSON {

  private final static String DATA_FILE = "data.gpx";

  public static void main(String[] args) throws Exception {
    DOMParser parser = new DOMParser();

    parser.parse(new File(DATA_FILE).toURI().toURL());
    XMLDocument doc = parser.getDocument();

    JSONObject jsonRoot = new JSONObject();

    Node docRoot = (Node)doc.getDocumentElement();
    if (!"gpx".equals(docRoot.getNodeName())) {
      System.out.println("Oops");
    } else {
      System.out.println("Moving on");
      NodeList nodes = docRoot.getChildNodes();
      int count = nodes.getLength();
      for (int i=0; i<count; i++) {
        Node n = nodes.item(i);
        if (n instanceof XMLElement)
        {
          XMLElement el = (XMLElement)n;
          System.out.println("-> " + el.getNodeName());
          parseNode(jsonRoot, el, docRoot.getNodeName(), 0);
        }
      }
      System.out.println(jsonRoot.toString(2));
    }
  }

  private static void parseNode(JSONObject json, XMLElement el, String parentName, int level) {
    if (el.getNodeType() == XMLElement.ELEMENT_NODE)
    {
      JSONObject obj = new JSONObject();
      json.append(el.getNodeName(), obj);
      NodeList nl = el.getChildNodes();
      for (int i=0; i<nl.getLength(); i++) {
        if (nl.item(i) instanceof XMLElement)
        {
          System.out.println(lpad("", 2 * level, " ") + nl.item(i).getNodeName());
          parseNode(obj, (XMLElement)nl.item(i), nl.item(i).getNodeName(), level + 1);
        } else if (nl.item(i) instanceof XMLText) {
          XMLText txt = (XMLText)nl.item(i);
          String content = txt.getNodeValue();
          if (content.trim().length() > 0)
          {
            System.out.println(lpad("", 2 * level, " ") + parentName + ":" + content);
          }
        }
      }
    } else if (el.getNodeType() == XMLElement.TEXT_NODE) {
      String value = el.getNodeValue();
      System.out.println(" Node Text:" + value);
    } else {
      System.out.println("Bim");
    }
  }

  private static String lpad(String str, int len, String pad) {
    String s = str;
    while (s.length() < len) {
      s = pad + s;
    }
    return s;
  }
}
