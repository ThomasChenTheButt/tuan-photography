import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: inURL) else { print("cannot read"); exit(1) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
try handler.perform([req])
guard let result = req.results?.first else { print("no subject found"); exit(2) }
let maskPB = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: maskPB)
let ctx = CIContext()
guard let cg = ctx.createCGImage(out, from: out.extent) else { print("render failed"); exit(3) }
let rep = NSBitmapImageRep(cgImage: cg)
guard let png = rep.representation(using: .png, properties: [:]) else { exit(4) }
try png.write(to: outURL)
print("ok \(cg.width)x\(cg.height) instances=\(result.allInstances.count)")
